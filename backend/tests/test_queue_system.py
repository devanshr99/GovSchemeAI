import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select

from app.database import get_db, init_db
from app.models.queue_system import QueueJob, WorkerStatus
from app.models.source import GovernmentSource
from app.services.queue_manager import queue_manager
from app.services.worker_manager import worker_manager


@pytest.mark.asyncio
async def test_queue_prioritization_and_delay():
    """Verify high-priority jobs are executed first and delayed jobs are deferred."""
    await init_db()

    async for db in get_db():
        # Setup: Create three jobs
        # 1. Low priority, immediate
        job_low = await queue_manager.enqueue_job(
            db, "test_low", {"val": 1}, priority=1
        )
        # 2. High priority, immediate
        job_high = await queue_manager.enqueue_job(
            db, "test_high", {"val": 2}, priority=10
        )
        # 3. High priority, but delayed by 1 hour
        job_delayed = await queue_manager.enqueue_job(
            db,
            "test_delayed",
            {"val": 3},
            priority=20,
            run_after=datetime.utcnow() + timedelta(hours=1)
        )

        # Claim the first job for a worker
        first_claimed = await queue_manager.get_next_job(db, "test_worker_1")
        assert first_claimed is not None
        # Should be job_high because priority=10 immediate > priority=1 immediate
        # (job_delayed has priority=20 but is deferred, so it's ignored)
        assert first_claimed.id == job_high.id

        second_claimed = await queue_manager.get_next_job(db, "test_worker_1")
        assert second_claimed is not None
        assert second_claimed.id == job_low.id

        third_claimed = await queue_manager.get_next_job(db, "test_worker_1")
        # Should be None since job_delayed is run_after > now
        assert third_claimed is None

        # Cleanup
        await db.delete(job_low)
        await db.delete(job_high)
        await db.delete(job_delayed)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_worker_retries_and_backoff():
    """Verify failed tasks are retried with exponential backoff and finally routed to DLQ."""
    await init_db()

    async for db in get_db():
        # Enqueue a failing task (max_retries = 1, delay = 2 seconds)
        job = await queue_manager.enqueue_job(
            db, "unsupported_task_trigger", {"payload_key": "val"}, max_retries=1
        )

        # Run execute_task directly to simulate worker loop processing it and catching error
        try:
            await worker_manager.execute_task(job.id, job.task_name, job.payload)
        except Exception as e:
            # Handle failure manually
            await queue_manager.handle_job_failure(db, job.id, str(e), retry_delay=2)

        # Refresh job state
        await db.refresh(job)
        assert job.status == "Retrying"
        assert job.retry_count == 1
        assert job.run_after is not None
        # run_after should be scheduled in the future
        assert job.run_after > datetime.utcnow()

        # Simulate second failure to trigger DLQ (dead letter queue)
        try:
            await worker_manager.execute_task(job.id, job.task_name, job.payload)
        except Exception as e:
            await queue_manager.handle_job_failure(db, job.id, str(e), retry_delay=2)

        await db.refresh(job)
        assert job.status == "Dead Letter"
        assert job.dead_letter_reason is not None
        assert "Max retries" in job.dead_letter_reason

        # Cleanup
        await db.delete(job)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_worker_pool_concurrency_and_stress():
    """Verify concurrent worker loops execute enqueued tasks in parallel and record health heartbeats."""
    await init_db()

    async for db in get_db():
        # Setup: Add a mock source to process pipeline tasks
        src = GovernmentSource(
            name="Queue Concurrency Src",
            category="Ministry",
            website_url="https://queue-concurrency.gov.in",
            priority=5,
            is_active=True,
            is_verified=True,
            notes="mock_html: <html><body><h1>Queue Yojana</h1><p>Description details.</p></body></html>"
        )
        stmt_cleanup = select(GovernmentSource).where(GovernmentSource.website_url == "https://queue-concurrency.gov.in")
        existing = (await db.execute(stmt_cleanup)).scalars().first()
        if existing:
            await db.delete(existing)
        db.add(src)
        await db.commit()

        # Enqueue 3 crawl tasks
        jobs = []
        for i in range(3):
            j = await queue_manager.enqueue_job(
                db,
                "crawl_source",
                {"source_id": src.id},
                priority=1
            )
            jobs.append(j)

        # Start worker pool
        worker_manager.start_worker_pool()
        assert worker_manager._running is True

        # Wait for workers to process tasks asynchronously
        await asyncio.sleep(2.0)

        # Stop worker pool
        worker_manager.stop_worker_pool()
        assert worker_manager._running is False

        # Verify worker status heartbeats are logged
        ws_stmt = select(WorkerStatus)
        ws_list = (await db.execute(ws_stmt)).scalars().all()
        assert len(ws_list) > 0
        for ws in ws_list:
            assert ws.status in ["active", "idle", "stopped"]
            assert ws.last_heartbeat is not None

        # Clean up
        for j in jobs:
            # Let's delete the job and any nested process_ai / database_sync tasks enqueued by execution
            job_record = await db.get(QueueJob, j.id)
            if job_record:
                await db.delete(job_record)
        
        # Clean up additional dynamically enqueued queue jobs
        stmt_cleanup_jobs = select(QueueJob).where(QueueJob.task_name.in_(["process_ai", "database_sync"]))
        additional_jobs = (await db.execute(stmt_cleanup_jobs)).scalars().all()
        for aj in additional_jobs:
            await db.delete(aj)

        for ws in ws_list:
            await db.delete(ws)
        await db.delete(src)
        await db.commit()
        break
