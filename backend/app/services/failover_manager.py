import asyncio
import logging
import time
from datetime import datetime
from sqlalchemy import select, text
from app.config import get_settings
from app import database
from app.database import failover_database_engine_async
from app.models.backup import FailoverEvent, DisasterEvent
from app.services.notification_engine import notification_engine

logger = logging.getLogger(__name__)

class FailoverManager:
    """
    Background daemon that monitors database connectivity. If the primary connection
    fails, it dynamically migrates the connection pool to the replica URL, logs failover
    history, runs data check validation, and dispatches critical administrator alerts.
    """
    def __init__(self):
        self.settings = get_settings()
        self.running = False
        self.check_interval_seconds = 10
        self.primary_failed = False

    async def start_monitoring_daemon(self):
        self.running = True
        logger.info("Database Health check & Failover daemon initialized.")
        asyncio.create_task(self._monitoring_loop())

    async def stop_monitoring_daemon(self):
        self.running = False
        logger.info("Database Health check & Failover daemon stopped.")

    async def _monitoring_loop(self):
        while self.running:
            try:
                await asyncio.sleep(self.check_interval_seconds)
                # Verify primary connection is queryable
                await self._check_database_availability()
            except Exception as e:
                logger.error(f"Error in failover monitoring loop: {e}")

    async def _check_database_availability(self):
        # Trigger query heartbeat check
        try:
            async with database.async_session() as session:
                await session.execute(text("SELECT 1"))
            # If database was marked failed previously but is now operational, reset
            if self.primary_failed:
                logger.info("Primary database recovered connectivity.")
                self.primary_failed = False
        except Exception as e:
            # Heartbeat failed!
            logger.warning(f"Database heartbeat check failed: {e}")
            if not self.primary_failed:
                self.primary_failed = True
                await self.trigger_failover()

    async def trigger_failover(self):
        """
        Executes connection switchover to secondary DB, creates failover metadata record,
        validates query status, and alerts admins.
        """
        start_time = time.perf_counter()
        replica_url = self.settings.replica_database_url
        if not replica_url:
            logger.error("Database connection failure detected, but replica_database_url is not configured.")
            return

        logger.critical(f"DATABASE OUTAGE DETECTED. Executing dynamic failover to: {replica_url}")

        # 1. Swapping global SQLAlchemy connection engine
        try:
            await failover_database_engine_async(replica_url)
        except Exception as fail_err:
            logger.error(f"Failed to switch database connection engine: {fail_err}")
            return

        # Let connection settle
        await asyncio.sleep(1.0)

        # 2. Write Failover & Disaster Logs (in new replica database)
        recovery_time = time.perf_counter() - start_time
        validated = False

        try:
            async with database.async_session() as session:
                # Post-recovery query validation
                await session.execute(text("SELECT 1"))
                validated = True

                # Log failover event
                failover = FailoverEvent(
                    from_instance=self.settings.database_url,
                    to_instance=replica_url,
                    status="Succeeded",
                    triggered_by="system",
                    validated=validated,
                    recovery_time_seconds=round(recovery_time, 2)
                )
                session.add(failover)

                # Log disaster event
                disaster = DisasterEvent(
                    target="Database",
                    severity="CRITICAL",
                    description=f"Primary database connection timeout. Switched connection pool dynamically to replica.",
                    detected_at=datetime.utcnow()
                )
                session.add(disaster)

                await session.commit()

                # Trigger slack/email alerts
                await notification_engine.publish_event(
                    session,
                    event_type="failover_triggered",
                    severity="CRITICAL",
                    title="Database Failover Succeeded",
                    message=f"Primary database outage detected. Switched connection pools to replica. Recovery time: {round(recovery_time, 2)}s.",
                    details={"replica_url": replica_url, "recovery_time_seconds": recovery_time}
                )

            logger.info("Dynamic database failover validated and completed successfully.")

        except Exception as recovery_err:
            logger.error(f"Post-failover validation or logging failed: {recovery_err}", exc_info=True)
            # Send alert regarding failed recovery
            try:
                async with database.async_session() as session:
                    await notification_engine.publish_event(
                        session,
                        event_type="recovery_failed",
                        severity="CRITICAL",
                        title="Failover Recovery Validation Failed",
                        message=f"Failover to replica succeeded but verification failed: {str(recovery_err)}",
                        details={"replica_url": replica_url, "error": str(recovery_err)}
                    )
            except Exception:
                logger.error("Failed to publish recovery failure notification.")

failover_manager = FailoverManager()
