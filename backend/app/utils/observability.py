import os
import time
import socket
import logging
import asyncio
import contextvars
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import psutil
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import event, select, func
from sqlalchemy.engine import Engine
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

from app.config import get_settings
from app.database import async_session
from app.models.scheme import Scheme
from app.models.queue_system import QueueJob, WorkerStatus
from app.models.scheduler import JobExecutionHistory

logger = logging.getLogger("govscheme.observability")
settings = get_settings()

# Context variables for Distributed Tracing
trace_id_var = contextvars.ContextVar("trace_id", default="")
request_id_var = contextvars.ContextVar("request_id", default="")
job_id_var = contextvars.ContextVar("job_id", default="")
user_id_var = contextvars.ContextVar("user_id", default="")

# --- PROMETHEUS INSTRUMENTS ---

# 1. System Metrics
SYSTEM_CPU_USAGE = Gauge("govscheme_system_cpu_usage_percent", "System-wide CPU utilization percentage")
SYSTEM_MEMORY_USAGE = Gauge("govscheme_system_memory_usage_percent", "System-wide memory utilization percentage")
SYSTEM_DISK_USAGE = Gauge("govscheme_system_disk_usage_percent", "System disk space utilization percentage")
SYSTEM_NETWORK_USAGE = Counter("govscheme_system_network_bytes_total", "System network traffic in bytes", ["direction"])

# 2. API Metrics
HTTP_REQUESTS_TOTAL = Counter(
    "govscheme_http_requests_total",
    "Total HTTP requests received",
    ["method", "endpoint", "status_code"]
)
HTTP_REQUEST_LATENCY_SECONDS = Histogram(
    "govscheme_http_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)
ACTIVE_SESSIONS = Gauge("govscheme_active_sessions", "Number of currently active user sessions")
CONCURRENT_USERS = Gauge("govscheme_concurrent_users", "Number of concurrent API users")

# 3. Database Metrics
DB_LATENCY_SECONDS = Histogram(
    "govscheme_db_latency_seconds",
    "Database query latency in seconds",
    ["query_type"]
)
DB_CONNECTIONS_ACTIVE = Gauge("govscheme_db_connections_active", "Number of active database connections")

# 4. Queue & Worker Metrics
QUEUE_LENGTH = Gauge("govscheme_queue_length", "Number of pending or queued background jobs", ["status"])
WORKER_UTILIZATION = Gauge("govscheme_worker_utilization", "Background worker execution utilization", ["worker_id"])

# 5. Scheduler Metrics
SCHEDULER_STATUS = Gauge("govscheme_scheduler_status", "Scheduler running state (1 = running, 0 = stopped)")
JOB_SUCCESS_RATE = Counter(
    "govscheme_scheduler_job_executions_total",
    "Total scheduler job runs",
    ["job_name", "status"]
)

# 6. Service Specific Metrics
CRAWLER_SUCCESS_RATE = Counter(
    "govscheme_crawler_runs_total",
    "Total crawler execution attempts",
    ["source", "status"]
)
AI_PROCESSING_TIME_SECONDS = Histogram(
    "govscheme_ai_processing_seconds",
    "AI agent execution time in seconds",
    ["agent"]
)
SEARCH_LATENCY_SECONDS = Histogram("govscheme_search_latency_seconds", "Intelligent search latency in seconds")
NOTIFICATION_DELIVERY_RATE = Counter(
    "govscheme_notification_delivery_total",
    "Total notification delivery events",
    ["channel", "status"]
)

# 7. Business Metrics
TOTAL_SCHEMES = Gauge("yojana_business_total_schemes", "Total schemes in the database")
NEW_SCHEMES_TODAY = Gauge("yojana_business_new_schemes_today", "New schemes added today")
UPDATED_SCHEMES_TODAY = Gauge("yojana_business_updated_schemes_today", "Schemes updated today")
INACTIVE_SCHEMES = Gauge("yojana_business_inactive_schemes", "Inactive schemes count")
WITHDRAWN_SCHEMES = Gauge("yojana_business_withdrawn_schemes", "Withdrawn schemes count")
CRAWLER_SUCCESS = Counter("yojana_business_crawler_success_total", "Total successful page crawls")
VALIDATION_SUCCESS = Counter("yojana_business_validation_success_total", "Total safety and scheme validations")
DUPLICATE_RATE = Counter("yojana_business_duplicates_detected_total", "Total duplicates detected during ingestion")
AVERAGE_CONFIDENCE_SCORE = Gauge("yojana_business_average_confidence_score", "Average scheme confidence score (0-100)")


# --- FASTAPI MIDDLEWARE FOR API METRICS ---

class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Track concurrent users
        CONCURRENT_USERS.inc()
        start_time = time.perf_counter()

        # Generate request and trace IDs if not present in request headers
        trace_id = request.headers.get("x-trace-id") or request.headers.get("x-trace-id".upper()) or f"tr_{os.urandom(8).hex()}"
        req_id = request.headers.get("x-request-id") or request.headers.get("x-request-id".upper()) or f"req_{os.urandom(8).hex()}"

        # Propagate through contextvars
        t_token = trace_id_var.set(trace_id)
        r_token = request_id_var.set(req_id)

        # Track active session (mock estimate based on user ID or IP client host)
        ACTIVE_SESSIONS.set(1.0) # Simple metric placeholder

        method = request.method
        endpoint = request.url.path

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            
            # Record metrics
            status_code = str(response.status_code)
            HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
            HTTP_REQUEST_LATENCY_SECONDS.labels(method=method, endpoint=endpoint).observe(duration)
            
            # Propagate trace ID back in response headers
            response.headers["X-Trace-Id"] = trace_id
            response.headers["X-Request-Id"] = req_id
            return response
        except Exception as e:
            duration = time.perf_counter() - start_time
            HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code="500").inc()
            HTTP_REQUEST_LATENCY_SECONDS.labels(method=method, endpoint=endpoint).observe(duration)
            raise e
        finally:
            CONCURRENT_USERS.dec()
            trace_id_var.reset(t_token)
            request_id_var.reset(r_token)


# --- DB LATENCY EVENTS ---

@event.listens_for(Engine, "before_cursor_execute", retval=False)
def db_before_execute(conn, cursor, statement, parameters, context, executemany):
    if context:
        context._start_time = time.perf_counter()

@event.listens_for(Engine, "after_cursor_execute", retval=False)
def db_after_execute(conn, cursor, statement, parameters, context, executemany):
    if context and hasattr(context, "_start_time"):
        duration = time.perf_counter() - context._start_time
        # Determine query type (SELECT, INSERT, UPDATE, etc.)
        query_type = statement.split()[0].upper() if statement else "UNKNOWN"
        DB_LATENCY_SECONDS.labels(query_type=query_type).observe(duration)


# --- PERIODIC BACKGROUND GATHERING LOOP ---

class TelemetryCollector:
    def __init__(self):
        self._task = None
        self._running = False
        # Store alert statuses to prevent spamming
        self._alert_states = {}

    def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._gather_loop())
            logger.info("Telemetry and Alerting background loop started.")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            logger.info("Telemetry background loop stopped.")

    async def _gather_loop(self):
        # Allow server to start up completely first
        await asyncio.sleep(5.0)
        
        # Initial network bytes
        net_io = psutil.net_io_counters()
        last_in = net_io.bytes_recv
        last_out = net_io.bytes_sent

        while self._running:
            try:
                # 1. System Metrics Gather
                SYSTEM_CPU_USAGE.set(psutil.cpu_percent())
                SYSTEM_MEMORY_USAGE.set(psutil.virtual_memory().percent)
                SYSTEM_DISK_USAGE.set(psutil.disk_usage("/").percent)
                
                # Network Bytes Diff
                net_io = psutil.net_io_counters()
                SYSTEM_NETWORK_USAGE.labels(direction="in").inc(max(0, net_io.bytes_recv - last_in))
                SYSTEM_NETWORK_USAGE.labels(direction="out").inc(max(0, net_io.bytes_sent - last_out))
                last_in = net_io.bytes_recv
                last_out = net_io.bytes_sent

                # 2. Database Aggregated Metrics & Queue Telemetry
                async with async_session() as db:
                    # Schemes Count Metrics
                    total_sc = (await db.execute(select(func.count(Scheme.id)))).scalar() or 0
                    TOTAL_SCHEMES.set(total_sc)

                    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                    new_sc = (await db.execute(select(func.count(Scheme.id)).where(Scheme.created_at >= today_start))).scalar() or 0
                    NEW_SCHEMES_TODAY.set(new_sc)

                    updated_sc = (await db.execute(select(func.count(Scheme.id)).where((Scheme.last_checked >= today_start) & (Scheme.created_at < today_start)))).scalar() or 0
                    UPDATED_SCHEMES_TODAY.set(updated_sc)

                    inactive_sc = (await db.execute(select(func.count(Scheme.id)).where(Scheme.status == "inactive"))).scalar() or 0
                    INACTIVE_SCHEMES.set(inactive_sc)

                    withdrawn_sc = (await db.execute(select(func.count(Scheme.id)).where(Scheme.status == "withdrawn"))).scalar() or 0
                    WITHDRAWN_SCHEMES.set(withdrawn_sc)

                    # Queue Job Metrics
                    q_pending = (await db.execute(select(func.count(QueueJob.id)).where(QueueJob.status.in_(["Pending", "Queued"])))).scalar() or 0
                    q_running = (await db.execute(select(func.count(QueueJob.id)).where(QueueJob.status == "Running"))).scalar() or 0
                    q_dlq = (await db.execute(select(func.count(QueueJob.id)).where(QueueJob.status == "Dead Letter"))).scalar() or 0
                    
                    QUEUE_LENGTH.labels(status="pending").set(q_pending)
                    QUEUE_LENGTH.labels(status="running").set(q_running)
                    QUEUE_LENGTH.labels(status="dead_letter").set(q_dlq)

                    # Worker Heartbeat Counts
                    threshold = datetime.utcnow() - timedelta(seconds=60)
                    online_workers = (await db.execute(select(WorkerStatus).where(WorkerStatus.last_heartbeat >= threshold))).scalars().all()
                    
                    # Update Worker utilization stats
                    for worker in online_workers:
                        WORKER_UTILIZATION.labels(worker_id=worker.id).set(worker.cpu_usage)

                # 3. Evaluate Alerts Core Daemon
                await self._evaluate_alert_rules(
                    q_pending=q_pending,
                    online_workers_count=len(online_workers),
                    cpu_val=SYSTEM_CPU_USAGE._value.get(),
                    mem_val=SYSTEM_MEMORY_USAGE._value.get(),
                    disk_val=SYSTEM_DISK_USAGE._value.get()
                )

            except Exception as e:
                logger.error(f"Error gathering telemetry data: {e}", exc_info=True)

            await asyncio.sleep(15.0)

    async def _evaluate_alert_rules(
        self, q_pending: int, online_workers_count: int, cpu_val: float, mem_val: float, disk_val: float
    ):
        """Checks metric values against thresholds and raises alerts via GovSchemeAI Notification Engine."""
        from app.services.notification_engine import notification_engine
        
        # Helper to trigger alerts with cooldowns handled natively by notification engine
        async def trigger_alert(event_type: str, severity: str, title: str, message: str):
            async with async_session() as db:
                await notification_engine.publish_event(
                    db,
                    event_type=event_type,
                    severity=severity,
                    title=title,
                    message=message
                )

        # Alert 1: Low Disk Space
        if disk_val > 90.0:
            await trigger_alert(
                "low_disk_space", "CRITICAL", "Low Disk Space Alert",
                f"Host disk space is critically low: {disk_val:.1f}% used."
            )
        
        # Alert 2: High CPU
        if cpu_val > 90.0:
            await trigger_alert(
                "high_cpu", "WARNING", "High CPU Utilization",
                f"Host CPU usage is high: {cpu_val:.1f}%."
            )

        # Alert 3: High Memory
        if mem_val > 90.0:
            await trigger_alert(
                "high_memory", "WARNING", "High Memory Utilization",
                f"Host Memory usage is high: {mem_val:.1f}%."
            )

        # Alert 4: Worker Failure / Offline
        if online_workers_count == 0:
            await trigger_alert(
                "worker_offline", "CRITICAL", "All Queue Workers Offline",
                "No background worker heartbeats detected in the last 60 seconds."
            )

        # Alert 5: Queue Overflow
        if q_pending > 50:
            await trigger_alert(
                "queue_overflow", "WARNING", "Queue Processing Backlog",
                f"Pending/Queued background jobs backlog exceeds threshold: {q_pending} jobs waiting."
            )

        # Alert 6: Database Down check (already run implicitly, but let's do a fast query verify)
        try:
            async with async_session() as db:
                await db.execute(select(1))
        except Exception as db_err:
            await trigger_alert(
                "database_down", "CRITICAL", "Database Connectivity Failed",
                f"API connection to database is down. Error: {db_err}"
            )

        # Alert 7: Redis Down check
        if settings.redis_url:
            try:
                import urllib.parse
                parsed = urllib.parse.urlparse(settings.redis_url)
                host = parsed.hostname or "localhost"
                port = parsed.port or 6379
                s = socket.create_connection((host, port), timeout=2.0)
                s.close()
            except Exception as redis_err:
                await trigger_alert(
                    "redis_down", "CRITICAL", "Redis Service Offline",
                    f"Unable to connect to Redis server. Error: {redis_err}"
                )

        # Alert 8: Repeated AI / Validation / Database Sync failures
        async with async_session() as db:
            # Check latest 5 process_ai jobs
            ai_jobs = (await db.execute(
                select(QueueJob).where(QueueJob.task_name == "process_ai").order_by(QueueJob.created_at.desc()).limit(5)
            )).scalars().all()
            if len(ai_jobs) >= 5 and all(j.status in ("Failed", "Dead Letter") for j in ai_jobs):
                await trigger_alert(
                    "repeated_ai_failures", "CRITICAL", "Repeated AI Extraction Failures",
                    "The last 5 consecutive AI extraction pipeline tasks have failed."
                )

            # Check latest 5 database sync jobs
            sync_jobs = (await db.execute(
                select(QueueJob).where(QueueJob.task_name == "database_sync").order_by(QueueJob.created_at.desc()).limit(5)
            )).scalars().all()
            if len(sync_jobs) >= 5 and all(j.status in ("Failed", "Dead Letter") for j in sync_jobs):
                await trigger_alert(
                    "repeated_sync_failures", "CRITICAL", "Repeated Database Sync Failures",
                    "The last 5 consecutive database sync tasks have failed."
                )

            # Check latest 5 scheduler executions
            sched_history = (await db.execute(
                select(JobExecutionHistory).order_by(JobExecutionHistory.started_at.desc()).limit(5)
            )).scalars().all()
            if len(sched_history) >= 5 and all(h.status == "Failed" for h in sched_history):
                await trigger_alert(
                    "scheduler_failure", "CRITICAL", "Repeated Scheduler Pipeline Failures",
                    "The last 5 consecutive scheduler pipeline orchestration runs have failed."
                )


# Global Singleton Telemetry Collector
telemetry_collector = TelemetryCollector()
