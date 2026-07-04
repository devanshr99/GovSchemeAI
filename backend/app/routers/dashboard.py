import os
import logging
from collections import deque
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.config import get_settings
from app.models.source import GovernmentSource
from app.models.crawler import CrawlQueueItem, CrawlExtraction
from app.models.scheme import Scheme
from app.models.audit import SyncAuditLog
from app.models.scheduler import SchedulerJob, JobExecutionHistory
from app.models.queue_system import QueueJob, WorkerStatus
from app.models.notification import Notification, NotificationLog
from app.services.queue_manager import queue_manager
from app.services.cache import cache

logger = logging.getLogger("yojana.routers.dashboard")
settings = get_settings()

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])


# ── InMemory Logging Handler ──────────────────────────────────────────────────

class InMemoryLogHandler(logging.Handler):
    """Stores the last 200 logs in-memory for live dashboard inspection."""
    def __init__(self, maxlen: int = 200):
        super().__init__()
        self.log_buffer = deque(maxlen=maxlen)

    def emit(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }
        self.log_buffer.append(log_entry)


memory_log_handler = InMemoryLogHandler()
memory_log_handler.setLevel(logging.INFO)
# Attach to root logger
logging.getLogger().addHandler(memory_log_handler)


# ── Security Dependency ───────────────────────────────────────────────────────

async def verify_admin(
    token: Optional[str] = Query(None),
    x_admin_token: Optional[str] = Header(None)
):
    """Enforces token authorization check for admin routes and rejects blacklisted tokens."""
    expected = settings.jwt_secret or "yojana-ai-dev-secret-change-in-prod"
    active_token = token or x_admin_token

    # 1. Verification Check
    if token != expected and x_admin_token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized admin access. Please provide a valid token."
        )

    # 2. Blacklist Check
    from app.services.security_hardener import security_hardener
    if active_token and security_hardener.is_token_blacklisted(active_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been logged out. Access token is blacklisted."
        )


# ── Stats API ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=dict, dependencies=[Depends(verify_admin)])
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Aggregates real-time statistics across all 10 core modules."""
    # Check cache first
    cached_stats = await cache.get("admin_dashboard_stats")
    if cached_stats is not None:
        return cached_stats

    now = datetime.utcnow()

    # 1. System Overview - Online workers & actual resources
    online_worker_stmt = select(func.count(WorkerStatus.id)).where(WorkerStatus.last_heartbeat >= now - timedelta(seconds=60))
    online_workers = (await db.execute(online_worker_stmt)).scalar() or 0

    import psutil
    cpu_val = psutil.cpu_percent()
    mem_val = psutil.virtual_memory().percent
    disk_val = psutil.disk_usage("/").percent

    # 2. Queue Job stats (queued, running, failed, dlq)
    queued_jobs = 0
    running_jobs = 0
    failed_jobs = 0
    dlq_size = 0
    q_stmt = select(QueueJob.status, func.count(QueueJob.id)).group_by(QueueJob.status)
    q_results = (await db.execute(q_stmt)).all()
    for status_val, count_val in q_results:
        if status_val in ("Pending", "Queued"):
            queued_jobs += count_val
        elif status_val == "Running":
            running_jobs = count_val
        elif status_val == "Failed":
            failed_jobs = count_val
        elif status_val == "Dead Letter":
            dlq_size = count_val

    # 3. Government Sources stats
    total_sources = 0
    active_sources = 0
    src_stmt = select(GovernmentSource.is_active, func.count(GovernmentSource.id)).group_by(GovernmentSource.is_active)
    src_results = (await db.execute(src_stmt)).all()
    for is_active_val, count_val in src_results:
        total_sources += count_val
        if is_active_val:
            active_sources = count_val
    disabled_sources = total_sources - active_sources

    # 4. Crawler Dashboard stats
    crawled_pages = 0
    failed_crawls = 0
    crawler_stmt = select(CrawlQueueItem.status, func.count(CrawlQueueItem.id)).group_by(CrawlQueueItem.status)
    crawler_results = (await db.execute(crawler_stmt)).all()
    for status_val, count_val in crawler_results:
        if status_val == "processed":
            crawled_pages = count_val
        elif status_val == "failed":
            failed_crawls = count_val

    # 5. AI Processing stats
    ai_stmt = select(func.count(CrawlExtraction.id), func.avg(CrawlExtraction.validation_report["confidence_score"]))
    ai_res = (await db.execute(ai_stmt)).one()
    processed_ai = ai_res[0] or 0
    avg_confidence = float(ai_res[1]) if ai_res[1] is not None else 0.0

    # 6. Database Sync stats
    new_schemes = 0
    updated_schemes = 0
    failed_syncs = 0
    sync_stmt = select(SyncAuditLog.operation, func.count(SyncAuditLog.id)).group_by(SyncAuditLog.operation)
    sync_results = (await db.execute(sync_stmt)).all()
    for op_val, count_val in sync_results:
        if op_val == "INSERT":
            new_schemes = count_val
        elif op_val == "UPDATE":
            updated_schemes = count_val
        elif op_val == "ROLLBACK":
            failed_syncs = count_val

    # 7. Lifecycle stats
    active_schemes = 0
    inactive_schemes = 0
    withdrawn_schemes = 0
    expired_schemes = 0
    lifecycle_stmt = select(Scheme.status, func.count(Scheme.id)).group_by(Scheme.status)
    lifecycle_results = (await db.execute(lifecycle_stmt)).all()
    for status_val, count_val in lifecycle_results:
        if status_val == "active":
            active_schemes = count_val
        elif status_val == "inactive":
            inactive_schemes = count_val
        elif status_val == "withdrawn":
            withdrawn_schemes = count_val
        elif status_val == "expired":
            expired_schemes = count_val

    # 8. Scheduler stats
    sched_running = 0
    sched_failed = 0
    sched_stmt = select(JobExecutionHistory.status, func.count(JobExecutionHistory.id)).group_by(JobExecutionHistory.status)
    sched_results = (await db.execute(sched_stmt)).all()
    for status_val, count_val in sched_results:
        if status_val == "Running":
            sched_running = count_val
        elif status_val == "Failed":
            sched_failed = count_val

    # 9. Notifications stats
    notif_sent = 0
    notif_failed = 0
    notif_stmt = select(NotificationLog.status, func.count(NotificationLog.id)).group_by(NotificationLog.status)
    notif_results = (await db.execute(notif_stmt)).all()
    for status_val, count_val in notif_results:
        if status_val == "delivered":
            notif_sent = count_val
        elif status_val == "failed":
            notif_failed = count_val

    # 10. Critical Alerts
    critical_alerts_stmt = select(func.count(Notification.id)).where(Notification.severity == "CRITICAL")
    critical_alerts = (await db.execute(critical_alerts_stmt)).scalar() or 0

    # 11. Search Metrics (Phase 21)
    from app.models.search_history import SearchHistory
    total_searches = (await db.execute(select(func.count(SearchHistory.id)))).scalar() or 0
    avg_search_latency = (await db.execute(select(func.avg(SearchHistory.execution_time_ms)))).scalar() or 0.0

    # Retrieve source list details (limit to prevent huge payloads)
    src_res = await db.execute(select(GovernmentSource).order_by(GovernmentSource.name).limit(100))
    sources_list = src_res.scalars().all()

    # Retrieve scheduler jobs list
    jobs_res = await db.execute(select(SchedulerJob).order_by(SchedulerJob.name).limit(50))
    jobs_list = jobs_res.scalars().all()

    # Retrieve recent audit logs
    audit_res = await db.execute(select(SyncAuditLog).order_by(desc(SyncAuditLog.timestamp)).limit(10))
    audit_logs = audit_res.scalars().all()

    # Retrieve recent scheme changes
    schemes_res = await db.execute(select(Scheme).order_by(desc(Scheme.last_checked)).limit(5))
    recent_schemes = schemes_res.scalars().all()

    stats_data = {
        "system": {
            "online_workers": online_workers,
            "queued_jobs": queued_jobs,
            "running_jobs": running_jobs,
            "failed_jobs": failed_jobs,
            "cpu_usage": cpu_val,
            "memory_usage": mem_val,
            "disk_usage": disk_val,
            "db_status": "Healthy"
        },
        "sources": {
            "total": total_sources,
            "active": active_sources,
            "disabled": disabled_sources,
            "list": [
                {
                    "id": s.id,
                    "name": s.name,
                    "website_url": s.website_url,
                    "is_active": s.is_active,
                    "category": s.category,
                    "last_checked": s.created_at.strftime("%Y-%m-%d") if s.created_at else "Never"
                } for s in sources_list
            ]
        },
        "crawler": {
            "crawled": crawled_pages,
            "failed": failed_crawls
        },
        "ai": {
            "processed": processed_ai,
            "avg_confidence": round(avg_confidence, 2)
        },
        "sync": {
            "new": new_schemes,
            "updated": updated_schemes,
            "failed": failed_syncs,
            "audits": [
                {
                    "operation": a.operation,
                    "scheme_id": a.scheme_id,
                    "details": a.details,
                    "timestamp": a.timestamp.strftime("%H:%M:%S") if a.timestamp else ""
                } for a in audit_logs
            ]
        },
        "lifecycle": {
            "active": active_schemes,
            "inactive": inactive_schemes,
            "withdrawn": withdrawn_schemes,
            "expired": expired_schemes,
            "recent": [
                {
                    "id": sc.id,
                    "name": sc.name,
                    "status": sc.status,
                    "updated_at": sc.last_checked.strftime("%Y-%m-%d") if sc.last_checked else ""
                } for sc in recent_schemes
            ]
        },
        "scheduler": {
            "running": sched_running,
            "failed": sched_failed,
            "jobs": [
                {
                    "id": j.id,
                    "name": j.name,
                    "type": j.job_type,
                    "cron": j.cron_expression,
                    "is_active": True
                } for j in jobs_list
            ]
        },
        "queue": {
            "dlq_size": dlq_size
        },
        "notifications": {
            "sent": notif_sent,
            "failed": notif_failed,
            "critical": critical_alerts
        },
        "search": {
            "total": total_searches,
            "avg_latency": round(avg_search_latency, 2)
        }
    }

    # Cache the computed stats for 15 seconds
    await cache.set("admin_dashboard_stats", stats_data, ttl_seconds=15.0)
    return stats_data


# ── Logs API ──────────────────────────────────────────────────────────────────

@router.get("/logs", response_model=list, dependencies=[Depends(verify_admin)])
async def get_logs(
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None)
):
    """Returns the in-memory buffered log lines with optional search and level filters."""
    logs = list(memory_log_handler.log_buffer)

    if level:
        level_upper = level.upper()
        logs = [log for log in logs if log["level"] == level_upper]

    if search:
        search_lower = search.lower()
        logs = [
            log for log in logs
            if search_lower in log["message"].lower() or search_lower in log["logger"].lower()
        ]

    return logs

# ── Actions ───────────────────────────────────────────────────────────────────

@router.post("/sources/{source_id}/toggle", response_model=dict, dependencies=[Depends(verify_admin)])
async def toggle_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Enables or disables a government source registry entry."""
    src = await db.get(GovernmentSource, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    src.is_active = not src.is_active
    db.add(src)
    await db.commit()
    await db.refresh(src)
    await cache.invalidate("admin_dashboard_stats")
    return {"status": "success", "is_active": src.is_active}


@router.post("/sources/{source_id}/refresh", response_model=dict, dependencies=[Depends(verify_admin)])
async def refresh_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Enqueues an immediate queue task crawl for a specific source."""
    src = await db.get(GovernmentSource, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    # Enqueue a crawl_source job in priority mode
    job = await queue_manager.enqueue_job(
        db,
        task_name="crawl_source",
        payload={"source_id": src.id},
        priority=5  # High priority refresh request
    )
    await cache.invalidate("admin_dashboard_stats")
    return {"status": "enqueued", "job_id": job.id}


@router.post("/scheduler/jobs/{job_id}/action", response_model=dict, dependencies=[Depends(verify_admin)])
async def scheduler_job_action(job_id: str, action: str = Query(..., regex="^(run_now|pause|resume|cancel)$"), db: AsyncSession = Depends(get_db)):
    """Coordinates trigger controls and status actions for background scheduler jobs."""
    job = await db.get(SchedulerJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if action == "run_now":
        # Enqueue a manual crawl task for every active source
        stmt = select(GovernmentSource).where(GovernmentSource.is_active == True)
        res = await db.execute(stmt)
        sources = res.scalars().all()
        for src in sources:
            await queue_manager.enqueue_job(
                db,
                task_name="crawl_source",
                payload={"source_id": src.id},
                priority=3
            )
        await cache.invalidate("admin_dashboard_stats")
        return {"status": "success", "message": f"Triggered crawls for {len(sources)} active sources."}

    # Custom pause/resume placeholders for external cron adapters
    await cache.invalidate("admin_dashboard_stats")
    return {"status": "success", "action": action, "job_id": job_id}


# ── Dashboard View ────────────────────────────────────────────────────────────

@router.get("/view", response_class=HTMLResponse)
async def serve_dashboard(token: Optional[str] = Query(None)):
    """Serves the premium single-page glassmorphism admin dashboard UI."""
    expected = settings.jwt_secret or "yojana-ai-dev-secret-change-in-prod"
    if token != expected:
        return HTMLResponse(
            status_code=401,
            content=f"""
            <html>
                <head>
                    <title>Unauthorized - GovSchemeAI Admin</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
                    <style>
                        body {{
                            background: #0b0f19;
                            color: #f3f4f6;
                            font-family: 'Outfit', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                        }}
                        .card {{
                            background: rgba(17, 24, 39, 0.8);
                            border: 1px solid rgba(255,255,255,0.08);
                            padding: 40px;
                            border-radius: 16px;
                            text-align: center;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                            max-width: 400px;
                        }}
                        input {{
                            width: 100%;
                            padding: 12px;
                            margin: 20px 0;
                            border: 1px solid rgba(255,255,255,0.15);
                            background: rgba(255,255,255,0.05);
                            border-radius: 8px;
                            color: white;
                            box-sizing: border-box;
                        }}
                        button {{
                            background: linear-gradient(135deg, #06b6d4, #3b82f6);
                            border: none;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            width: 100%;
                        }}
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>Admin Dashboard Access</h2>
                        <p style="color: #9ca3af;">Please enter your admin access token to load the monitoring console.</p>
                        <form method="get" action="/api/admin/dashboard/view">
                            <input type="password" name="token" placeholder="Access Token" required />
                            <button type="submit">Authenticate</button>
                        </form>
                    </div>
                </body>
            </html>
            """
        )

    # Serving the complete, highly responsive, beautiful dashboard view
    return HTMLResponse(
        content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>GovSchemeAI Admin Console</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                :root {{
                    --bg-dark: #0b0f19;
                    --panel-bg: rgba(17, 24, 39, 0.6);
                    --border-color: rgba(255, 255, 255, 0.08);
                    --accent-cyan: #06b6d4;
                    --accent-blue: #3b82f6;
                    --accent-warn: #f59e0b;
                    --accent-danger: #ef4444;
                    --text-primary: #f3f4f6;
                    --text-secondary: #9ca3af;
                }}
                body {{
                    background: var(--bg-dark);
                    color: var(--text-primary);
                    font-family: 'Outfit', sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    min-height: 100vh;
                }}
                /* Sidebar styling */
                .sidebar {{
                    width: 260px;
                    background: rgba(15, 23, 42, 0.9);
                    border-right: 1px solid var(--border-color);
                    padding: 30px 20px;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }}
                .sidebar h2 {{
                    margin: 0 0 40px 0;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-size: 24px;
                }}
                .menu-item {{
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    color: var(--text-secondary);
                }}
                .menu-item:hover, .menu-item.active {{
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border-left: 4px solid var(--accent-cyan);
                }}
                /* Main Workspace */
                .workspace {{
                    flex: 1;
                    padding: 40px;
                    box-sizing: border-box;
                    overflow-y: auto;
                    max-width: 1400px;
                    margin: 0 auto;
                    width: 100%;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 32px;
                    font-weight: 600;
                }}
                /* Glassmorphism Cards */
                .card {{
                    background: var(--panel-bg);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                    margin-bottom: 24px;
                }}
                .grid-stats {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }}
                .stat-box {{
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }}
                .stat-box h3 {{
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: var(--text-secondary);
                }}
                .stat-box p {{
                    margin: 0;
                    font-size: 36px;
                    font-weight: 700;
                    color: white;
                }}
                /* Tab panels */
                .panel {{
                    display: none;
                }}
                .panel.active {{
                    display: block;
                }}
                /* Tables styling */
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }}
                th, td {{
                    padding: 14px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }}
                th {{
                    color: var(--text-secondary);
                    font-weight: 500;
                }}
                td {{
                    font-family: 'Inter', sans-serif;
                }}
                /* Badge states */
                .badge {{
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                }}
                .badge.active, .badge.success {{ background: rgba(16, 185, 129, 0.15); color: #10b981; }}
                .badge.disabled, .badge.danger {{ background: rgba(239, 68, 68, 0.15); color: #ef4444; }}
                .badge.warn, .badge.retrying {{ background: rgba(245, 158, 11, 0.15); color: #f59e0b; }}
                /* Actions buttons */
                .btn {{
                    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: opacity 0.2s;
                }}
                .btn:hover {{ opacity: 0.9; }}
                .btn.btn-danger {{
                    background: var(--accent-danger);
                }}
                /* Logs viewer styling */
                .logs-window {{
                    background: #020617;
                    color: #38bdf8;
                    font-family: 'Courier New', monospace;
                    padding: 20px;
                    border-radius: 8px;
                    height: 400px;
                    overflow-y: auto;
                    font-size: 13px;
                    line-height: 1.5;
                }}
                .logs-filters {{
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                }}
                .logs-filters input, .logs-filters select {{
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    background: rgba(255,255,255,0.05);
                    color: white;
                }}
            </style>
        </head>
        <body>
            <div class="sidebar">
                <h2>GovSchemeAI Admin</h2>
                <div class="menu-item active" onclick="switchTab('overview')">System Overview</div>
                <div class="menu-item" onclick="switchTab('sources')">Gov Sources</div>
                <div class="menu-item" onclick="switchTab('jobs')">Scheduler & Queue</div>
                <div class="menu-item" onclick="switchTab('notifications')">Alerts & Audits</div>
                <div class="menu-item" onclick="switchTab('logs')">Live Logs</div>
            </div>

            <div class="workspace">
                <div class="header">
                    <h1>Admin Dashboard</h1>
                    <span class="badge success">SYSTEM ONLINE</span>
                </div>

                <!-- PANEL 1: OVERVIEW -->
                <div id="panel-overview" class="panel active">
                    <div class="grid-stats">
                        <div class="stat-box">
                            <h3>Workers Online</h3>
                            <p id="stat-workers">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>Running Tasks</h3>
                            <p id="stat-running">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>Queued Jobs</h3>
                            <p id="stat-queued">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>DLQ Size</h3>
                            <p id="stat-dlq">0</p>
                        </div>
                    </div>

                    <div class="grid-stats">
                        <div class="stat-box">
                            <h3>Total Schemes</h3>
                            <p id="stat-schemes">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>AI Avg Confidence</h3>
                            <p id="stat-ai-conf">0%</p>
                        </div>
                        <div class="stat-box">
                            <h3>Total Searches</h3>
                            <p id="stat-search-total">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>Avg Search Latency</h3>
                            <p id="stat-search-latency">0ms</p>
                        </div>
                    </div>

                    <div class="grid-stats" style="grid-template-columns: 1fr 1.5fr;">
                        <div class="card">
                            <h3>System Resources</h3>
                            <canvas id="resourceChart" style="max-height: 250px;"></canvas>
                        </div>
                        <div class="card">
                            <h3>Recent Scheme Updates</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Scheme Name</th>
                                        <th>Status</th>
                                        <th>Checked</th>
                                    </tr>
                                </thead>
                                <tbody id="table-recent-schemes">
                                    <!-- Rendered dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- PANEL 2: SOURCES -->
                <div id="panel-sources" class="panel">
                    <div class="card">
                        <h3>Trusted Government Sources Registry</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>URL</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="table-sources">
                                <!-- Rendered dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- PANEL 3: JOBS -->
                <div id="panel-jobs" class="panel">
                    <div class="card">
                        <h3>Background Scheduled Jobs</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Job Name</th>
                                    <th>Type</th>
                                    <th>Cron Expression</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="table-jobs">
                                <!-- Rendered dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- PANEL 4: ALERTS & AUDITS -->
                <div id="panel-notifications" class="panel">
                    <div class="grid-stats">
                        <div class="stat-box">
                            <h3>Delivered Notifications</h3>
                            <p id="stat-notif-sent" style="color: #10b981;">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>Failed Notifications</h3>
                            <p id="stat-notif-failed" style="color: #ef4444;">0</p>
                        </div>
                        <div class="stat-box">
                            <h3>Critical Alerts</h3>
                            <p id="stat-notif-critical" style="color: #f59e0b;">0</p>
                        </div>
                    </div>

                    <div class="card">
                        <h3>Recent Database Sync Audits</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Operation</th>
                                    <th>Details</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody id="table-audits">
                                <!-- Rendered dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- PANEL 5: LOGS -->
                <div id="panel-logs" class="panel">
                    <div class="card">
                        <h3>Application Event Logs</h3>
                        <div class="logs-filters">
                            <input type="text" id="log-search" placeholder="Search logs..." oninput="fetchLogs()">
                            <select id="log-level" onchange="fetchLogs()">
                                <option value="">All Levels</option>
                                <option value="INFO">INFO</option>
                                <option value="WARNING">WARNING</option>
                                <option value="ERROR">ERROR</option>
                            </select>
                            <button class="btn" onclick="downloadLogs()">Download Logs</button>
                        </div>
                        <div class="logs-window" id="logs-view">
                            <!-- Logs lines -->
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const token = "{token}";
                let chart = null;

                function switchTab(tabId) {{
                    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.panel').forEach(el => el.classList.remove('active'));

                    event.target.classList.add('active');
                    document.getElementById('panel-' + tabId).classList.add('active');

                    if (tabId === 'logs') {{
                        fetchLogs();
                    }}
                }}

                async function fetchStats() {{
                    try {{
                        const res = await fetch(`/api/admin/dashboard/stats?token=${{token}}`);
                        const data = await res.json();

                        // Fill overview
                        document.getElementById('stat-workers').innerText = data.system.online_workers;
                        document.getElementById('stat-running').innerText = data.system.running_jobs;
                        document.getElementById('stat-queued').innerText = data.system.queued_jobs;
                        document.getElementById('stat-dlq').innerText = data.queue.dlq_size;

                        // Fill Phase 21 extended metrics
                        document.getElementById('stat-schemes').innerText = data.lifecycle.active + data.lifecycle.inactive + data.lifecycle.withdrawn + data.lifecycle.expired;
                        document.getElementById('stat-ai-conf').innerText = data.ai.avg_confidence.toFixed(0) + '%';
                        document.getElementById('stat-search-total').innerText = data.search.total;
                        document.getElementById('stat-search-latency').innerText = data.search.avg_latency.toFixed(1) + 'ms';

                        // Fill notifications stats
                        document.getElementById('stat-notif-sent').innerText = data.notifications.sent;
                        document.getElementById('stat-notif-failed').innerText = data.notifications.failed;
                        document.getElementById('stat-notif-critical').innerText = data.notifications.critical;

                        // Render recent schemes
                        const recentBody = document.getElementById('table-recent-schemes');
                        recentBody.innerHTML = data.lifecycle.recent.map(sc => `
                            <tr>
                                <td>${{sc.name}}</td>
                                <td><span class="badge ${{sc.status === 'active' ? 'success' : 'warn'}}">${{sc.status}}</span></td>
                                <td>${{sc.updated_at}}</td>
                            </tr>
                        `).join('');

                        // Render sources
                        const sourcesBody = document.getElementById('table-sources');
                        sourcesBody.innerHTML = data.sources.list.map(s => `
                            <tr>
                                <td>${{s.name}}</td>
                                <td>${{s.category}}</td>
                                <td><a href="${{s.website_url}}" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">${{s.website_url}}</a></td>
                                <td><span class="badge ${{s.is_active ? 'success' : 'danger'}}">${{s.is_active ? 'ACTIVE' : 'DISABLED'}}</span></td>
                                <td>
                                    <button class="btn" onclick="toggleSource('${{s.id}}')">${{s.is_active ? 'Disable' : 'Enable'}}</button>
                                    <button class="btn" style="margin-left: 8px;" onclick="refreshSource('${{s.id}}')">Crawl Now</button>
                                </td>
                            </tr>
                        `).join('');

                        // Render jobs
                        const jobsBody = document.getElementById('table-jobs');
                        jobsBody.innerHTML = data.scheduler.jobs.map(j => `
                            <tr>
                                <td>${{j.name}}</td>
                                <td>${{j.type}}</td>
                                <td><code>${{j.cron}}</code></td>
                                <td><span class="badge success">ACTIVE</span></td>
                                <td>
                                    <button class="btn" onclick="triggerJob('${{j.id}}')">Run Now</button>
                                </td>
                            </tr>
                        `).join('');

                        // Render audits
                        const auditsBody = document.getElementById('table-audits');
                        auditsBody.innerHTML = data.sync.audits.map(a => `
                            <tr>
                                <td><span class="badge ${{a.operation === 'INSERT' ? 'success' : 'warn'}}">${{a.operation}}</span></td>
                                <td>${{a.details}}</td>
                                <td>${{a.timestamp}}</td>
                            </tr>
                        `).join('');

                        // Render chart
                        updateChart(data.system.cpu_usage, data.system.memory_usage);

                    }} catch (e) {{
                        console.error("Stats fetch error: ", e);
                    }}
                }}

                function updateChart(cpu, mem) {{
                    const ctx = document.getElementById('resourceChart').getContext('2d');
                    if (chart) {{
                        chart.destroy();
                    }}
                    chart = new Chart(ctx, {{
                        type: 'doughnut',
                        data: {{
                            labels: ['CPU Usage (%)', 'Memory Usage (%)', 'Idle Space (%)'],
                            datasets: [{{
                                data: [cpu, mem, 100 - (cpu + mem)],
                                backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
                                borderWidth: 0
                            }}]
                        }},
                        options: {{
                            plugins: {{ legend: {{ labels: {{ color: '#fff' }} }} }}
                        }}
                    }});
                }}

                async function toggleSource(id) {{
                    await fetch(`/api/admin/dashboard/sources/${{id}}/toggle?token=${{token}}`, {{ method: 'POST' }});
                    fetchStats();
                }}

                async function refreshSource(id) {{
                    alert("Triggered manual refresh task!");
                    await fetch(`/api/admin/dashboard/sources/${{id}}/refresh?token=${{token}}`, {{ method: 'POST' }});
                }}

                async function triggerJob(id) {{
                    alert("Triggering job execution now!");
                    await fetch(`/api/admin/dashboard/scheduler/jobs/${{id}}/action?action=run_now&token=${{token}}`, {{ method: 'POST' }});
                }}

                async function fetchLogs() {{
                    const query = document.getElementById('log-search').value;
                    const level = document.getElementById('log-level').value;

                    const res = await fetch(`/api/admin/dashboard/logs?token=${{token}}&search=${{query}}&level=${{level}}`);
                    const data = await res.json();

                    const view = document.getElementById('logs-view');
                    view.innerHTML = data.map(log => `
                        <div>[${{log.timestamp}}] [${{log.level}}] [${{log.logger}}]: ${{log.message}}</div>
                    `).join('');
                }}

                function downloadLogs() {{
                    window.open(`/api/admin/dashboard/logs?token=${{token}}`);
                }}

                // Start polling stats
                fetchStats();
                setInterval(fetchStats, 5000);
            </script>
        </body>
        </html>
        """
    )
