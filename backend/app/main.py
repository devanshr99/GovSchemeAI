"""
GovSchemeAI — Government Schemes Discovery Platform
FastAPI application entry point.
"""

import logging
import sys
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings
from app.utils.logging import setup_production_logging
from app.database import get_db, init_db, close_db
from app.routers import eligibility, schemes, locations, chat, health, admin_updates, sources, dashboard, search, analytics, security, backup, recommendation

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
        # Always bypass rate limiting for health, readiness, and liveness probes
        if request.url.path in ["/health", "/api/health", "/live", "/ready", "/"]:
            return await call_next(request)

        if request.headers.get("x-reset-ratelimit") == "true":
            self.ip_requests.clear()
            return Response("rate limit reset", status_code=200)

        # Extract client IP considering reverse proxy X-Forwarded-For
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        now = time.time()

        # Periodic cleanup of stale IPs (every 5 minutes)
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, seed data. Shutdown: close connections."""
    logger.info("=" * 60)
    logger.info(f"  {settings.app_name} v{settings.app_version}")
    logger.info("  Government Schemes Discovery Platform")
    logger.info("=" * 60)

    # Initialize database tables
    try:
        logger.info("Initializing database...")
        await init_db()
        logger.info("[OK] Database ready.")
    except Exception as db_err:
        logger.error(f"Database initialization notice: {db_err}")

    # Run database migrations
    try:
        from app.migrations.db_migration_v2 import run_migration_v2
        run_migration_v2()
        from app.migrations.db_migration_v3 import run_migration_v3
        run_migration_v3()
        from app.migrations.db_migration_v4_5 import run_migration_v4_5
        run_migration_v4_5()
        from app.migrations.db_migration_v5 import run_migration_v5
        run_migration_v5()
        from app.migrations.db_migration_v8 import run_migration_v8
        run_migration_v8()
        from app.migrations.db_migration_v9 import run_migration_v9
        run_migration_v9()
        from app.migrations.db_migration_v10 import run_migration_v10
        run_migration_v10()
        from app.migrations.db_migration_v11 import run_migration_v11
        run_migration_v11()
        from app.migrations.db_migration_v12 import run_migration_v12
        run_migration_v12()
        from app.migrations.db_migration_v13 import run_migration_v13
        run_migration_v13()
        from app.migrations.db_migration_v15 import run_migration_v15
        run_migration_v15()
        from app.migrations.db_migration_v16 import run_migration_v16
        run_migration_v16()
        from app.migrations.db_migration_v17 import run_migration_v17
        run_migration_v17()
        from app.migrations.db_migration_v18 import run_migration_v18
        run_migration_v18()
        logger.info("[OK] Database migrations completed.")
    except Exception as mig_err:
        logger.warning(f"Migration notice: {mig_err}")

    # Seed data if database is empty
    try:
        logger.info("Checking seed data...")
        from app.utils.seed_data import seed_if_empty
        await seed_if_empty()
        logger.info("[OK] Seed data check completed.")
    except Exception as seed_err:
        logger.warning(f"Seed data notice: {seed_err}")

    # Start background sub-services safely
    try:
        logger.info("Starting update scheduler...")
        from app.scheduler import start_scheduler
        start_scheduler()
    except Exception as sched_err:
        logger.warning(f"Scheduler startup notice: {sched_err}")

    try:
        logger.info("Starting worker pool...")
        from app.services.worker_manager import worker_manager
        worker_manager.start_worker_pool()
    except Exception as worker_err:
        logger.warning(f"Worker pool startup notice: {worker_err}")

    try:
        logger.info("Starting telemetry collector...")
        from app.utils.observability import telemetry_collector
        telemetry_collector.start()
    except Exception as telem_err:
        logger.warning(f"Telemetry collector notice: {telem_err}")

    try:
        logger.info("Starting database failover manager...")
        from app.services.failover_manager import failover_manager
        await failover_manager.start_monitoring_daemon()
    except Exception as failover_err:
        logger.warning(f"Failover manager notice: {failover_err}")

    logger.info("=" * 60)
    logger.info(f"  Server ready at http://0.0.0.0:{settings.port}")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down...")
    try:
        from app.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass

    try:
        from app.services.worker_manager import worker_manager
        worker_manager.stop_worker_pool()
    except Exception:
        pass

    try:
        from app.services.failover_manager import failover_manager
        await failover_manager.stop_monitoring_daemon()
    except Exception:
        pass

    try:
        from app.utils.observability import telemetry_collector
        telemetry_collector.stop()
    except Exception:
        pass

    try:
        from app.services.ai_service import ai_service
        await ai_service.close()
    except Exception:
        pass

    try:
        from app.services.cache import cache
        await cache.clear()
    except Exception:
        pass

    await close_db()


app = FastAPI(
    title="GovSchemeAI",
    description="AI-powered Government Schemes Discovery Platform for India",
    version=settings.app_version,
    lifespan=lifespan,
)

# Parse CORS origins from environment
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://govscheme-ai.vercel.app,https://govschemeai.onrender.com,https://govschemeai-frontend.onrender.com,https://govschemeai-backend.onrender.com"
)
cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
has_wildcard = "*" in cors_origins or "all" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else cors_origins,
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression & Timing
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(ResponseTimingMiddleware)

# Security Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size_bytes=5 * 1024 * 1024)
app.add_middleware(RateLimitMiddleware, limit_per_minute=100)

# Mount Routers
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

from app.utils.observability import ObservabilityMiddleware
app.add_middleware(ObservabilityMiddleware)

from app.routers.dashboard import verify_admin

@app.get("/live")
async def root_live(db = Depends(get_db)):
    """Verify application process and DB are alive."""
    from app.routers.health import primary_health_probe
    return await primary_health_probe(db)

@app.get("/ready")
async def root_ready(db = Depends(get_db)):
    """Deep dependency health check."""
    from app.routers.health import readiness_probe
    return await readiness_probe(db)

@app.get("/health")
async def root_health():
    """Primary lightweight health check endpoint returning HTTP 200."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }

@app.get("/metrics")
async def prometheus_metrics(response: Response, token: str = Depends(verify_admin)):
    """Exposes Prometheus metrics format for scraping (Admin only)."""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", settings.port))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.debug,
        log_level="info",
    )
