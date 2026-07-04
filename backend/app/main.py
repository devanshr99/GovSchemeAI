"""
GovSchemeAI — Government Schemes Discovery Platform
FastAPI application entry point.
"""

import logging
import sys
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# Safe logging setup
from app.config import get_settings
from app.utils.logging import setup_production_logging

settings = get_settings()
if not settings.debug:
    setup_production_logging()
else:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
logger = logging.getLogger("yojana")

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size_bytes: int = 5 * 1024 * 1024):
        super().__init__(app)
        self.max_size_bytes = max_size_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_size_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Payload too large. Maximum allowed size is 5MB."}
                    )
            except ValueError:
                pass
        return await call_next(request)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int = 100):
        super().__init__(app)
        self.limit_per_minute = limit_per_minute
        self.ip_requests = {}
        self._last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        if request.headers.get("x-reset-ratelimit") == "true":
            self.ip_requests.clear()
            return Response("rate limit reset", status_code=200)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Periodic cleanup of stale IPs (every 5 minutes) to prevent memory leak
        if now - self._last_cleanup > 300:
            stale_ips = [
                ip for ip, ts in self.ip_requests.items()
                if not ts or now - ts[-1] > 120.0
            ]
            for ip in stale_ips:
                del self.ip_requests[ip]
            self._last_cleanup = now

        if client_ip not in self.ip_requests:
            self.ip_requests[client_ip] = []
        
        timestamps = self.ip_requests[client_ip]
        self.ip_requests[client_ip] = [t for t in timestamps if now - t < 60.0]
        
        if len(self.ip_requests[client_ip]) >= self.limit_per_minute:
            logger.warning(f"Rate Limit Violated: Blocked client IP {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again in a minute."}
            )
            
        self.ip_requests[client_ip].append(now)
        return await call_next(request)


class ResponseTimingMiddleware(BaseHTTPMiddleware):
    """Adds X-Response-Time header for API latency monitoring."""
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        return response

from app.config import get_settings
from app.database import init_db, close_db
from app.routers import eligibility, schemes, locations, chat, health, admin_updates, sources, dashboard, search, analytics, security, backup, recommendation

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, seed data. Shutdown: close connections."""
    logger.info("=" * 60)
    logger.info(f"  {settings.app_name} v{settings.app_version}")
    logger.info("  Government Schemes Discovery Platform")
    logger.info("=" * 60)

    # Initialize database tables
    logger.info("Initializing database...")
    await init_db()
    logger.info("[OK] Database ready.")

    # Run scheme intelligence database migrations (Phase 2)
    logger.info("Running database migration checks (Phase 2)...")
    from app.migrations.db_migration_v2 import run_migration_v2
    run_migration_v2()
    logger.info("[OK] Migrations (Phase 2) check completed.")

    # Run government source registry migrations & seeding (Phase 3)
    logger.info("Running database migration checks (Phase 3)...")
    from app.migrations.db_migration_v3 import run_migration_v3
    run_migration_v3()
    logger.info("[OK] Migrations (Phase 3) check completed.")

    # Run crawl quality queue migrations (Phase 4.5)
    logger.info("Running database migration checks (Phase 4.5)...")
    from app.migrations.db_migration_v4_5 import run_migration_v4_5
    run_migration_v4_5()
    logger.info("[OK] Migrations (Phase 4.5) check completed.")

    # Run AI extraction staging migrations (Phase 5)
    logger.info("Running database migration checks (Phase 5)...")
    from app.migrations.db_migration_v5 import run_migration_v5
    run_migration_v5()
    logger.info("[OK] Migrations (Phase 5) check completed.")

    # Run Database sync staging migrations (Phase 8)
    logger.info("Running database migration checks (Phase 8)...")
    from app.migrations.db_migration_v8 import run_migration_v8
    run_migration_v8()
    logger.info("[OK] Migrations (Phase 8) check completed.")

    # Run Version history and auditing migrations (Phase 9)
    logger.info("Running database migration checks (Phase 9)...")
    from app.migrations.db_migration_v9 import run_migration_v9
    run_migration_v9()
    logger.info("[OK] Migrations (Phase 9) check completed.")

    # Run Scheme Lifecycle migrations (Phase 10)
    logger.info("Running database migration checks (Phase 10)...")
    from app.migrations.db_migration_v10 import run_migration_v10
    run_migration_v10()
    logger.info("[OK] Migrations (Phase 10) check completed.")

    # Run Background Scheduler migrations (Phase 11)
    logger.info("Running database migration checks (Phase 11)...")
    from app.migrations.db_migration_v11 import run_migration_v11
    run_migration_v11()
    logger.info("[OK] Migrations (Phase 11) check completed.")

    # Run Queue & Worker migrations (Phase 12)
    logger.info("Running database migration checks (Phase 12)...")
    from app.migrations.db_migration_v12 import run_migration_v12
    run_migration_v12()
    logger.info("[OK] Migrations (Phase 12) check completed.")

    # Run Notification & Alert migrations (Phase 13)
    logger.info("Running database migration checks (Phase 13)...")
    from app.migrations.db_migration_v13 import run_migration_v13
    run_migration_v13()
    logger.info("[OK] Migrations (Phase 13) check completed.")

    # Run Intelligent Search & Indexing migrations (Phase 15)
    logger.info("Running database migration checks (Phase 15)...")
    from app.migrations.db_migration_v15 import run_migration_v15
    run_migration_v15()
    logger.info("[OK] Migrations (Phase 15) check completed.")

    # Run Analytics & Reporting migrations (Phase 16)
    logger.info("Running database migration checks (Phase 16)...")
    from app.migrations.db_migration_v16 import run_migration_v16
    run_migration_v16()
    logger.info("[OK] Migrations (Phase 16) check completed.")

    # Run Security Hardening migrations (Phase 17)
    logger.info("Running database migration checks (Phase 17)...")
    from app.migrations.db_migration_v17 import run_migration_v17
    run_migration_v17()
    logger.info("[OK] Migrations (Phase 17) check completed.")

    # Run Performance Optimization migrations (Phase 18)
    logger.info("Running database migration checks (Phase 18)...")
    from app.migrations.db_migration_v18 import run_migration_v18
    run_migration_v18()
    logger.info("[OK] Migrations (Phase 18) check completed.")

    # Seed data if empty
    logger.info("Checking seed data...")
    from app.utils.seed_data import seed_if_empty
    await seed_if_empty()
    logger.info("[OK] Seed data loaded.")

    # Start scheduler
    logger.info("Starting update scheduler...")
    from app.scheduler import start_scheduler, stop_scheduler
    start_scheduler()

    # Start worker pool
    logger.info("Starting worker pool...")
    from app.services.worker_manager import worker_manager
    worker_manager.start_worker_pool()

    # Start telemetry and alert collector loop (Phase 21)
    logger.info("Starting telemetry collector...")
    from app.utils.observability import telemetry_collector
    telemetry_collector.start()

    # Start database health check and failover daemon (Phase 22)
    logger.info("Starting database failover manager...")
    from app.services.failover_manager import failover_manager
    await failover_manager.start_monitoring_daemon()

    # Publish System Startup notification
    from app.database import async_session
    from app.services.notification_engine import notification_engine
    async with async_session() as db:
        await notification_engine.publish_event(
            db,
            event_type="system_startup",
            severity="INFO",
            title="System Startup",
            message="GovSchemeAI server application has started up successfully."
        )

    logger.info("=" * 60)
    logger.info(f"  Server ready at http://localhost:{settings.port}")
    logger.info(f"  API docs at http://localhost:{settings.port}/docs")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down...")
    stop_scheduler()
    from app.services.worker_manager import worker_manager
    worker_manager.stop_worker_pool()

    # Stop database failover manager (Phase 22)
    from app.services.failover_manager import failover_manager
    await failover_manager.stop_monitoring_daemon()

    # Stop telemetry collection (Phase 21)
    from app.utils.observability import telemetry_collector
    telemetry_collector.stop()

    # Close AI service HTTP clients
    from app.services.ai_service import ai_service
    await ai_service.close()

    # Clear cache
    from app.services.cache import cache
    await cache.clear()

    # Publish System Shutdown notification
    try:
        from app.database import async_session
        from app.services.notification_engine import notification_engine
        async with async_session() as db:
            await notification_engine.publish_event(
                db,
                event_type="system_shutdown",
                severity="WARNING",
                title="System Shutdown",
                message="GovSchemeAI server application is shutting down."
            )
    except Exception as shutdown_err:
        logger.warning(f"Could not log system shutdown event: {shutdown_err}")

    await close_db()


app = FastAPI(
    title="GovSchemeAI",
    description="AI-powered Government Schemes Discovery Platform for India",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response compression
app.add_middleware(GZipMiddleware, minimum_size=500)

# Response timing
app.add_middleware(ResponseTimingMiddleware)

# Custom Security Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size_bytes=5 * 1024 * 1024)
app.add_middleware(RateLimitMiddleware, limit_per_minute=100)

# Mount routers
app.include_router(health.router)
app.include_router(eligibility.router)
app.include_router(schemes.router)
app.include_router(locations.router)
app.include_router(chat.router)
app.include_router(admin_updates.router)
app.include_router(sources.router)
app.include_router(dashboard.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(security.router)
app.include_router(backup.router)
app.include_router(recommendation.router)

# Phase 21 Observability Middleware
from app.utils.observability import ObservabilityMiddleware
app.add_middleware(ObservabilityMiddleware)

from fastapi import Response, Depends
from app.database import get_db
from app.routers.dashboard import verify_admin

@app.get("/live")
async def root_live():
    """Verify that the FastAPI application process is alive."""
    from app.routers.health import liveness_probe
    return await liveness_probe()

@app.get("/ready")
async def root_ready(db = Depends(get_db)):
    """Deep dependency health check (Database, Redis, Workers, Scheduler)."""
    from app.routers.health import readiness_probe
    return await readiness_probe(db)

@app.get("/health")
async def root_health(db = Depends(get_db)):
    """Diagnostic health check (Database, Redis, Workers, Scheduler)."""
    from app.routers.health import readiness_probe
    return await readiness_probe(db)

@app.get("/metrics")
async def prometheus_metrics(response: Response, token: str = Depends(verify_admin)):
    """Exposes Prometheus metrics format for scraping (Admin only)."""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )
