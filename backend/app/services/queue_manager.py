import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.queue_system import QueueJob

logger = logging.getLogger("yojana.queue.manager")


class QueueManagerService:
    """
    Manages task enqueuing, priority claims, status updates, retries,
    exponential backoffs, and dead letter queue (DLQ) routing.
    """

    async def enqueue_job(
        self,
        db: AsyncSession,
        task_name: str,
        payload: Dict[str, Any],
        priority: int = 1,
        run_after: Optional[datetime] = None,
        max_retries: int = 3
    ) -> QueueJob:
        """
        Enqueues a new background task.
        Validates the task and prevents duplicate execution of pending/queued items.
        """
        # Validate task payload or name
        if not task_name:
            raise ValueError("Task name cannot be empty")

        # Inject active trace_id and request_id into payload for context propagation (Phase 21)
        from app.utils.observability import trace_id_var, request_id_var
        current_trace = trace_id_var.get()
        current_req = request_id_var.get()
        if current_trace and "_trace_id" not in payload:
            payload["_trace_id"] = current_trace
        if current_req and "_request_id" not in payload:
            payload["_request_id"] = current_req

        # Duplicate pending job prevention check
        # If there is already an identical pending/queued task, reuse it instead of piling duplicates
        stmt = select(QueueJob).where(
            (QueueJob.task_name == task_name) &
            (QueueJob.status.in_(["Pending", "Queued"]))
        ).limit(5)
        res = await db.execute(stmt)
        existing = res.scalars().all()
        for job in existing:
            # Simple payload comparison
            if job.payload == payload:
                logger.info(f"Skipping enqueue of duplicate pending task {task_name}")
                return job

        job = QueueJob(
            task_name=task_name,
            payload=payload,
            priority=priority,
            status="Pending",
            run_after=run_after,
            max_retries=max_retries,
            retry_count=0
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"Job Queued: {job.id} | Task: {task_name} | Priority: {priority}")
        return job

    async def get_next_job(self, db: AsyncSession, worker_id: str) -> Optional[QueueJob]:
        """
        Claims and locks the next available task for the requesting worker.
        Supports Priority Queue, Delayed Queue (run_after constraint), and backoff states.
        """
        now = datetime.utcnow()
        # Find candidates: status 'Pending', 'Queued', or 'Retrying', and run_after <= now or None
        # Limit candidates list to 5 to avoid loading large numbers of queued jobs into memory
        stmt = select(QueueJob).where(
            (QueueJob.status.in_(["Pending", "Queued", "Retrying"])) &
            ((QueueJob.run_after == None) | (QueueJob.run_after <= now))
        ).order_by(
            desc(QueueJob.priority),
            QueueJob.created_at
        ).limit(5)

        res = await db.execute(stmt)
        candidates = res.scalars().all()

        for job in candidates:
            # Double check/claim using optimistic-style locking
            job.status = "Running"
            job.worker_id = worker_id
            db.add(job)
            try:
                await db.commit()
                await db.refresh(job)
                logger.info(f"Worker {worker_id} claimed job {job.id} ({job.task_name})")
                return job
            except Exception as e:
                # Concurrent transaction might have claimed it first, rollback and try next candidate
                await db.rollback()
                logger.warning(f"Worker {worker_id} claim conflict on job {job.id}: {e}. Retrying next...")
                continue

        return None

    async def handle_job_success(self, db: AsyncSession, job_id: str):
        """Transitions a completed job to Completed status."""
        job = await db.get(QueueJob, job_id)
        if job:
            job.status = "Completed"
            job.error_message = None
            db.add(job)
            await db.commit()
            logger.info(f"Job Completed successfully: {job_id}")

    async def handle_job_failure(self, db: AsyncSession, job_id: str, error_msg: str, retry_delay: int = 10):
        """
        Handles task execution failure.
        Applies exponential backoff and schedules retries, or routes to Dead Letter Queue (DLQ) if max retries exceeded.
        """
        job = await db.get(QueueJob, job_id)
        if not job:
            return

        job.error_message = error_msg

        if job.retry_count < job.max_retries:
            # Retry policy: increment retry_count, apply exponential backoff delay
            job.retry_count += 1
            job.status = "Retrying"
            
            # Backoff math: delay * 2^(retry_count - 1)
            backoff_sec = retry_delay * (2 ** (job.retry_count - 1))
            job.run_after = datetime.utcnow() + timedelta(seconds=backoff_sec)
            
            db.add(job)
            await db.commit()
            logger.info(f"Retry Started: Job {job_id} failed. Scheduling retry attempt {job.retry_count} after {backoff_sec}s delay.")

            # Publish warning event
            from app.services.notification_engine import notification_engine
            await notification_engine.publish_event(
                db,
                event_type="worker_failure",
                severity="WARNING",
                title="Queue Task Failed",
                message=f"Queue job {job_id} ({job.task_name}) failed and is retrying. Error: {error_msg}",
                details={"job_id": job_id, "retry_count": job.retry_count}
            )
        else:
            # Move permanently failed job into Dead Letter Queue state
            job.status = "Dead Letter"
            job.dead_letter_reason = f"Max retries ({job.max_retries}) exceeded. Last error: {error_msg}"
            db.add(job)
            await db.commit()
            logger.error(f"Dead Letter Entry: Job {job_id} moved to DLQ. Reason: {job.dead_letter_reason}")

            # Publish critical retry limit reached event
            from app.services.notification_engine import notification_engine
            await notification_engine.publish_event(
                db,
                event_type="retry_limit_reached",
                severity="CRITICAL",
                title="Retry Limit Reached - Moved to DLQ",
                message=f"Queue job {job_id} ({job.task_name}) failed permanently and was moved to the Dead Letter Queue. Reason: {job.dead_letter_reason}",
                details={"job_id": job_id, "error": error_msg}
            )


# Singleton
queue_manager = QueueManagerService()
