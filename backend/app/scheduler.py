"""
Redirection module adapting the old scheduler triggers to the new SchedulerEngineService (Phase 11).
"""

import logging
import asyncio
from app.config import get_settings
from app.services.scheduler_engine import scheduler_engine

logger = logging.getLogger("yojana.scheduler")
settings = get_settings()


async def _register_default_job():
    """Internal helper to insert the default scheduled cron job into the database on startup."""
    from app.database import async_session
    async with async_session() as db:
        try:
            await scheduler_engine.register_recurring_job(
                db,
                name="default_update_pipeline",
                cron_expression=settings.update_schedule_cron
            )
            logger.info("Successfully registered default recurring update pipeline.")
        except Exception as e:
            logger.error(f"Failed to register default recurring update job: {e}")


def start_scheduler():
    """
    Initialize and start the background scheduler.
    Called during FastAPI lifespan startup.
    """
    if not settings.update_enabled:
        logger.info("Update scheduler is DISABLED (UPDATE_ENABLED=false)")
        return

    # Start engine
    scheduler_engine.start_scheduler()

    # Enqueue database setup of the default recurring job asynchronously
    asyncio.create_task(_register_default_job())


def stop_scheduler():
    """
    Gracefully shut down the scheduler.
    Called during FastAPI lifespan shutdown.
    """
    scheduler_engine.shutdown_scheduler()


def get_scheduler_status() -> dict:
    """
    Get current scheduler status for health/admin endpoints.
    """
    if not scheduler_engine._running:
        return {
            "enabled": settings.update_enabled,
            "running": False,
            "next_run": None,
            "cron": settings.update_schedule_cron,
        }

    next_run = None
    jobs = scheduler_engine.scheduler.get_jobs()
    if jobs:
        for j in jobs:
            if j.next_run_time:
                next_run = j.next_run_time.isoformat()
                break

    return {
        "enabled": True,
        "running": True,
        "next_run": next_run,
        "cron": settings.update_schedule_cron,
    }
