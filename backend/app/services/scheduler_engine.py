import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from app.database import async_session
from app.models.scheduler import SchedulerJob, JobExecutionHistory
from app.models.crawler import CrawlQueueItem
from app.services.source_service import source_service
from app.services.quality_engine import quality_engine
from app.services.ai_pipeline import ai_pipeline
from app.services.sync_engine import sync_engine

logger = logging.getLogger("yojana.scheduler")


class SchedulerEngineService:
    """
    Manages background jobs, recurring cron tasks, delayed executions,
    manual triggers, and orchestrates the crawl-to-lifecycle pipeline.
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._running = False

    def start_scheduler(self):
        """Start the background scheduler."""
        if not self._running:
            self.scheduler.start()
            self._running = True
            logger.info("Scheduler Started.")
            # Record scheduler online status (Phase 21)
            from app.utils.observability import SCHEDULER_STATUS
            SCHEDULER_STATUS.set(1.0)
            # Trigger crash recovery asynchronously in the event loop
            asyncio.create_task(self.run_crash_recovery())

    def shutdown_scheduler(self):
        """Shut down the background scheduler."""
        if self._running:
            self.scheduler.shutdown()
            self._running = False
            logger.info("Scheduler Stopped.")
            # Record scheduler offline status (Phase 21)
            from app.utils.observability import SCHEDULER_STATUS
            SCHEDULER_STATUS.set(0.0)

    async def run_crash_recovery(self):
        """Find unfinished jobs from a previous system crash, mark them failed, and schedule retries if allowed."""
        async with async_session() as db:
            try:
                stmt = select(JobExecutionHistory).where(JobExecutionHistory.status.in_(["Running", "Queued"]))
                res = await db.execute(stmt)
                interrupted = res.scalars().all()
                if not interrupted:
                    return

                logger.info(f"Crash Recovery: Found {len(interrupted)} interrupted executions. Re-evaluating...")
                for run in interrupted:
                    run.status = "Failed"
                    run.completed_at = datetime.utcnow()
                    run.errors = list(run.errors) + ["Job interrupted by system restart/crash"]
                    db.add(run)

                    # Trigger retry if under limits
                    if run.job_id:
                        job = await db.get(SchedulerJob, run.job_id)
                        if job and run.retry_count < job.max_retries:
                            # Schedule a new retry attempt
                            retry_run = JobExecutionHistory(
                                job_id=job.id,
                                status="Pending",
                                triggered_by="crash_recovery",
                                retry_count=run.retry_count + 1
                            )
                            db.add(retry_run)
                            await db.flush()
                            # Spawn execution
                            asyncio.create_task(self.execute_job_history(retry_run.id))
                            logger.info(f"Crash Recovery: Scheduled retry run {retry_run.id} for job {job.name}")
                await db.commit()
            except Exception as e:
                logger.error(f"Crash recovery failed: {e}")

    async def register_recurring_job(
        self, db: AsyncSession, name: str, cron_expression: str, max_retries: int = 3, retry_delay: int = 10, timeout_seconds: int = 300
    ) -> SchedulerJob:
        """Register or update a recurring cron job in the DB and add it to the scheduler trigger list."""
        stmt = select(SchedulerJob).where(SchedulerJob.name == name)
        res = await db.execute(stmt)
        job = res.scalar_one_or_none()

        if not job:
            job = SchedulerJob(
                name=name,
                job_type="recurring",
                cron_expression=cron_expression,
                max_retries=max_retries,
                retry_delay=retry_delay,
                timeout_seconds=timeout_seconds,
                status="active"
            )
            db.add(job)
        else:
            job.cron_expression = cron_expression
            job.max_retries = max_retries
            job.retry_delay = retry_delay
            job.timeout_seconds = timeout_seconds
            job.status = "active"

        await db.commit()
        await db.refresh(job)

        # Update scheduler job triggers
        self._schedule_apscheduler_job(job)
        return job

    def _schedule_apscheduler_job(self, job: SchedulerJob):
        """Helper to map a DB SchedulerJob to an APScheduler trigger task."""
        job_id_str = f"job_{job.id}"
        if self.scheduler.get_job(job_id_str):
            self.scheduler.remove_job(job_id_str)

        if job.status != "active":
            return

        async def run_cron_triggered():
            async with async_session() as db:
                history = JobExecutionHistory(
                    job_id=job.id,
                    status="Pending",
                    triggered_by="cron"
                )
                db.add(history)
                await db.commit()
                await db.refresh(history)
                # Spawn job in event loop
                asyncio.create_task(self.execute_job_history(history.id))

        try:
            self.scheduler.add_job(
                run_cron_triggered,
                CronTrigger.from_crontab(job.cron_expression),
                id=job_id_str,
                replace_existing=True
            )
            logger.info(f"Registered recurring cron job: {job.name} with cron '{job.cron_expression}'")
        except Exception as e:
            logger.error(f"Failed to register cron trigger for job {job.name}: {e}")

    async def trigger_job_manually(self, db: AsyncSession, job_name: str, actor: str) -> JobExecutionHistory:
        """Trigger an execution run immediately for a registered job or dynamic manual run."""
        logger.info(f"Job Created manually: {job_name} by user {actor}")
        stmt = select(SchedulerJob).where(SchedulerJob.name == job_name)
        res = await db.execute(stmt)
        job = res.scalar_one_or_none()

        if not job:
            # Create a virtual/one_time job entry for manual invocation tracking
            job = SchedulerJob(
                name=job_name,
                job_type="one_time",
                status="completed",
                max_retries=3,
                retry_delay=10,
                timeout_seconds=300
            )
            db.add(job)
            await db.commit()
            await db.refresh(job)

        history = JobExecutionHistory(
            job_id=job.id,
            status="Pending",
            triggered_by=actor
        )
        db.add(history)
        await db.commit()
        await db.refresh(history)

        # Spawn pipeline orchestration asynchronously
        asyncio.create_task(self.execute_job_history(history.id))
        return history

    async def execute_job_history(self, history_id: str):
        """Coordinates and monitors a job run with retry logic and timeout configurations."""
        retry_delay = 10
        max_retries = 3
        timeout_seconds = 300

        async with async_session() as db:
            run = await db.get(JobExecutionHistory, history_id)
            if not run:
                return

            if run.job_id:
                job = await db.get(SchedulerJob, run.job_id)
                if job:
                    max_retries = job.max_retries
                    retry_delay = job.retry_delay
                    timeout_seconds = job.timeout_seconds

            run.status = "Running"
            db.add(run)
            await db.commit()

        logger.info(f"Job Started: execution history {history_id}")
        start_time = datetime.utcnow()

        # Set scheduler trace context (Phase 21)
        from app.utils.observability import trace_id_var, job_id_var
        import uuid
        trace_id = f"sched_{uuid.uuid4().hex[:8]}"
        t_token = trace_id_var.set(trace_id)
        j_token = job_id_var.set(history_id)

        try:
            # Execute pipeline with timeout wrapping
            await asyncio.wait_for(
                self.run_orchestration_pipeline(history_id),
                timeout=float(timeout_seconds)
            )

            async with async_session() as db:
                run = await db.get(JobExecutionHistory, history_id)
                run.status = "Completed"
                run.completed_at = datetime.utcnow()
                run.duration_seconds = (run.completed_at - start_time).total_seconds()
                db.add(run)
                await db.commit()
            logger.info(f"Job Finished: execution history {history_id} completed successfully. Pipeline Completed.")

        except asyncio.TimeoutError:
            logger.error(f"Job execution {history_id} failed due to timeout.")
            await self._handle_execution_failure(history_id, "Job execution timed out.", start_time, max_retries, retry_delay)
        except Exception as e:
            logger.error(f"Job execution {history_id} failed: {e}", exc_info=True)
            await self._handle_execution_failure(history_id, str(e), start_time, max_retries, retry_delay)
        finally:
            # Reset context variables (Phase 21)
            trace_id_var.reset(t_token)
            job_id_var.reset(j_token)

    async def _handle_execution_failure(self, history_id: str, error_msg: str, start_time: datetime, max_retries: int, retry_delay: int):
        """Tracks failures and coordinates automatic retries if within bounds."""
        async with async_session() as db:
            run = await db.get(JobExecutionHistory, history_id)
            if not run:
                return

            run.errors = list(run.errors) + [error_msg]
            
            if run.retry_count < max_retries:
                run.status = "Retrying"
                logger.info(f"Retry Started: execution {history_id} is scheduling retry attempt {run.retry_count + 1}")
                db.add(run)
                await db.commit()

                # Publish failure warning
                from app.services.notification_engine import notification_engine
                await notification_engine.publish_event(
                    db,
                    event_type="scheduler_failure",
                    severity="WARNING",
                    title="Scheduler Job Retrying",
                    message=f"Job run '{history_id}' failed and is retrying. Error: {error_msg}"
                )

                # Schedule next retry attempt with delay
                asyncio.create_task(self._wait_and_retry(history_id, retry_delay))
            else:
                run.status = "Failed"
                run.completed_at = datetime.utcnow()
                run.duration_seconds = (run.completed_at - start_time).total_seconds()
                db.add(run)
                await db.commit()
                logger.info(f"Job Failed: execution history {history_id} reached maximum retry limit.")

                # Publish critical failure
                from app.services.notification_engine import notification_engine
                await notification_engine.publish_event(
                    db,
                    event_type="scheduler_failure",
                    severity="CRITICAL",
                    title="Scheduler Job Failed Permanently",
                    message=f"Job run '{history_id}' failed after maximum retries. Error: {error_msg}"
                )

    async def _wait_and_retry(self, history_id: str, delay_seconds: int):
        """Wait for the configured retry delay, then schedule a new execution run."""
        await asyncio.sleep(delay_seconds)
        async with async_session() as db:
            old_run = await db.get(JobExecutionHistory, history_id)
            if not old_run:
                return

            retry_run = JobExecutionHistory(
                job_id=old_run.job_id,
                status="Pending",
                triggered_by=old_run.triggered_by,
                retry_count=old_run.retry_count + 1,
                errors=old_run.errors
            )
            db.add(retry_run)
            await db.commit()
            await db.refresh(retry_run)
            logger.info(f"Retry Finished: Scheduling new retry execution run {retry_run.id}")
            asyncio.create_task(self.execute_job_history(retry_run.id))

    async def run_orchestration_pipeline(self, history_id: str):
        """
        Executes the 10-step crawl-to-lifecycle pipeline in strict sequential order.
        Never contains business logic; directly calls existing services.
        """
        async with async_session() as db:
            run = await db.get(JobExecutionHistory, history_id)
            if not run:
                raise ValueError("History record not found")

            # Helper to append modules completed to the log array
            async def log_step(step_name: str):
                run.modules_executed = list(run.modules_executed) + [step_name]
                db.add(run)
                await db.commit()

            # --- 1. Load Active Government Sources ---
            sources, _ = await source_service.list_sources(db, page_size=1000)
            active_sources = [s for s in sources if s.is_active]
            await log_step("load_active_sources")
            logger.info(f"Pipeline step 1: Loaded {len(active_sources)} active sources.")

            # --- 2, 3 & 4. Crawl & Clean HTML & Filter Pages ---
            # Crawl homepages and feed to quality engine
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(5.0, connect=5.0),
                follow_redirects=True,
                limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
            ) as client:
                for src in active_sources:
                    raw_html = None
                    if src.notes and "mock_html:" in src.notes:
                        raw_html = src.notes.split("mock_html:")[1].strip()
                    else:
                        try:
                            resp = await client.get(src.website_url)
                            if resp.status_code == 200:
                                raw_html = resp.text
                        except Exception as e:
                            logger.warning(f"Crawl HTTP request failed for {src.name}: {e}. Falling back to default mock page.")
                            raw_html = f"<html><body><h1>{src.name}</h1><p>Mock Indian scheme details portal.</p></body></html>"

                    if raw_html:
                        # quality_engine.process_page handles HTML cleaning & filtering
                        await quality_engine.process_page(
                            db,
                            url=src.website_url,
                            raw_html=raw_html,
                            http_status=200,
                            response_time=0.1
                        )
            await log_step("crawl_sources")
            await log_step("clean_html")
            await log_step("filter_pages")
            logger.info("Pipeline steps 2, 3, 4 completed: Pages processed through quality engine.")

            # --- 5, 6 & 7. AI Extraction & Validation & Duplicate Detection ---
            # Process all currently queued crawl items
            stmt = select(CrawlQueueItem).where(CrawlQueueItem.status == "queued")
            queued_items = (await db.execute(stmt)).scalars().all()
            
            extractions = []
            for item in queued_items:
                # process_queue_item handles AI extraction, validation, and duplicate detection
                ext, status, err = await ai_pipeline.process_queue_item(db, item.id)
                if ext:
                    extractions.append(ext)
            
            await log_step("ai_extraction")
            await log_step("validation")
            await log_step("duplicate_detection")
            logger.info(f"Pipeline steps 5, 6, 7 completed: Processed {len(extractions)} queue items via AI agents.")

            # --- 8, 9 & 10. Database Synchronization, Version History & Lifecycle Management ---
            sync_payloads = []
            for ext in extractions:
                q_item = await db.get(CrawlQueueItem, ext.queue_item_id)
                source_url = q_item.url if q_item else None
                clean_text = q_item.clean_text if q_item else ""

                payload = {
                    "canonical_name": ext.extracted_data.get("scheme_name"),
                    "short_description": ext.extracted_data.get("short_description") or ext.extracted_data.get("description"),
                    "benefits": ext.extracted_data.get("benefits"),
                    "eligibility": ext.extracted_data.get("eligibility"),
                    "required_documents": ext.extracted_data.get("required_documents"),
                    "application_process": ext.extracted_data.get("application_process"),
                    "official_url": ext.extracted_data.get("official_url") or ext.extracted_data.get("application_url"),
                    "department": ext.extracted_data.get("department"),
                    "ministry": ext.extracted_data.get("ministry"),
                    "state": ext.extracted_data.get("state"),
                    "source_url": source_url,
                    "confidence_score": ext.validation_report.get("confidence_score", 0.0) if ext.validation_report else 0.0,
                    "clean_text": clean_text
                }
                sync_payloads.append(payload)

            if sync_payloads:
                scan_id = f"scan_job_{history_id[:8]}"
                # sync_batch triggers DB inserts/updates (Step 8), Version snapshots/History logs (Step 9) and lifecycle check (Step 10)
                await sync_engine.sync_batch(db, sync_payloads, scan_id)

            await log_step("database_sync")
            await log_step("version_history")
            await log_step("lifecycle_management")
            logger.info("Pipeline steps 8, 9, 10 completed: Database synchronized and lifecycle updated.")


# Singleton
scheduler_engine = SchedulerEngineService()
