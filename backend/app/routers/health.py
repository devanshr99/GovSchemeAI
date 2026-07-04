"""
Health check router — Probes app status, database, Redis, workers, and scheduler status.
"""

import socket
import urllib.parse
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.queue_system import WorkerStatus
from app.models.scheduler import SchedulerJob

router = APIRouter(prefix="/api/health", tags=["Health"])
settings = get_settings()


async def run_full_system_check(db: AsyncSession) -> tuple[str, dict]:
    """Unified system health validator checking all 7 targets."""
    health_status = "healthy"
    details = {}

    # 1. Database Connectivity Probe
    try:
        start_time = datetime.utcnow()
        await db.execute(text("SELECT 1"))
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000.0
        details["database"] = {
            "status": "up",
            "latency_ms": round(latency_ms, 2)
        }
    except Exception as e:
        health_status = "unhealthy"
        details["database"] = {
            "status": "down",
            "error": str(e)
        }

    # 2. Redis TCP Port Probe
    if settings.redis_url:
        try:
            parsed = urllib.parse.urlparse(settings.redis_url)
            host = parsed.hostname or "localhost"
            port = parsed.port or 6379
            s = socket.create_connection((host, port), timeout=2.0)
            s.close()
            details["redis"] = {
                "status": "up",
                "host": host,
                "port": port
            }
        except Exception as e:
            details["redis"] = {
                "status": "down",
                "error": str(e)
            }
    else:
        details["redis"] = {
            "status": "not_configured"
        }

    # 3. Active Background Queue Workers Probe
    try:
        threshold = datetime.utcnow() - timedelta(seconds=60)
        stmt = select(WorkerStatus).where(WorkerStatus.last_heartbeat >= threshold)
        res = await db.execute(stmt)
        active_workers = res.scalars().all()
        details["queue_workers"] = {
            "status": "up" if active_workers else "no_active_workers",
            "active_count": len(active_workers),
            "workers": [
                {
                    "id": w.id,
                    "status": w.status,
                    "running_jobs": w.running_jobs_count,
                    "completed_jobs": w.completed_jobs_count,
                    "failed_jobs": w.failed_jobs_count
                }
                for w in active_workers
            ]
        }
    except Exception as e:
        details["queue_workers"] = {
            "status": "down",
            "error": str(e)
        }

    # 4. Scheduler Configuration Probe
    try:
        stmt = select(SchedulerJob)
        res = await db.execute(stmt)
        jobs = res.scalars().all()
        details["scheduler"] = {
            "status": "up",
            "jobs_configured": len(jobs),
            "jobs": [
                {
                    "name": j.name,
                    "status": j.status,
                    "cron": j.cron_expression
                }
                for j in jobs
            ]
        }
    except Exception as e:
        details["scheduler"] = {
            "status": "down",
            "error": str(e)
        }

    # 5. Queue System Check
    try:
        from app.models.queue_system import QueueJob
        stmt = select(func.count(QueueJob.id)).where(QueueJob.status.in_(["Pending", "Queued"]))
        q_count = (await db.execute(stmt)).scalar() or 0
        details["queue"] = {
            "status": "up",
            "pending_jobs": q_count
        }
    except Exception as e:
        details["queue"] = {
            "status": "down",
            "error": str(e)
        }

    # 6. Web Crawler Status Check
    try:
        from app.models.crawler import CrawlQueueItem
        stmt = select(func.count(CrawlQueueItem.id))
        crawl_count = (await db.execute(stmt)).scalar() or 0
        details["crawler"] = {
            "status": "up",
            "total_crawled_items": crawl_count
        }
    except Exception as e:
        details["crawler"] = {
            "status": "down",
            "error": str(e)
        }

    # 7. AI Service Status Check
    try:
        # Check if settings have keys configured
        api_keys_configured = bool(settings.gemini_api_key or settings.openai_api_key or settings.anthropic_api_key or settings.openrouter_api_key)
        details["ai_service"] = {
            "status": "up" if api_keys_configured else "not_configured",
            "keys_ready": api_keys_configured
        }
    except Exception as e:
        details["ai_service"] = {
            "status": "down",
            "error": str(e)
        }

    return health_status, details


@router.get("/live")
async def liveness_probe(db: AsyncSession = Depends(get_db)):
    """Verify that the FastAPI application and dependencies are alive."""
    health_status, details = await run_full_system_check(db)
    response_data = {
        "status": health_status,
        "app": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details
    }
    if health_status == "unhealthy":
        raise HTTPException(status_code=503, detail=response_data)
    return response_data


@router.get("")
async def legacy_health_check(db: AsyncSession = Depends(get_db)):
    """Fallback compatible endpoint for default check."""
    return await liveness_probe(db)


@router.get("/ready")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Deep dependency health check (Database, Redis, Workers, Scheduler, Queue, Crawler, AI Service)."""
    health_status, details = await run_full_system_check(db)
    response_data = {
        "status": health_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": details
    }
    if health_status == "unhealthy":
        raise HTTPException(status_code=503, detail=response_data)
    return response_data
