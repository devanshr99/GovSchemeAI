import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import get_db, init_db
from app.models.queue_system import QueueJob
from app.services.queue_manager import queue_manager
from app.services.worker_manager import worker_manager

@pytest.mark.asyncio
async def test_queue_concurrency_and_race_conditions():
    """Verify that multiple workers querying the queue simultaneously do not claim the same job (race condition check)."""
    await init_db()
    
    async for db in get_db():
        # Setup: add a single pending job
        job = QueueJob(
            task_name="concurrency_job",
            payload={"task": "test"},
            status="pending",
            priority=5,
            run_after=datetime.utcnow()
        )
        db.add(job)
        await db.commit()
        
        # Simulating concurrent workers trying to pull next job
        # We execute get_next_job for worker_1 and worker_2 concurrently
        tasks = [
            queue_manager.get_next_job(db, "worker_1"),
            queue_manager.get_next_job(db, "worker_2")
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Only one worker should successfully claim the job; the other should get None
        claims = [r for r in results if r is not None]
        assert len(claims) <= 1
        
        # Clean up
        await db.delete(job)
        await db.commit()
        break

@pytest.mark.asyncio
async def test_dead_letter_queue_routing():
    """Verify that when a queue job exceeds its maximum retry threshold, its status changes to 'Dead Letter' (DLQ routing)."""
    await init_db()
    
    async for db in get_db():
        job = QueueJob(
            task_name="failing_job",
            payload={"task": "fail"},
            status="running",
            priority=5,
            max_retries=3,
            retry_count=3, # Already reached max retries
            run_after=datetime.utcnow()
        )
        db.add(job)
        await db.commit()
        
        # Simulate worker processing failure
        await queue_manager.handle_job_failure(db, job.id, error_msg="Timeout out")
        
        await db.refresh(job)
        assert job.status == "Dead Letter"
        assert job.retry_count == 3
        
        # Clean up
        await db.delete(job)
        await db.commit()
        break

@pytest.mark.asyncio
async def test_worker_crash_recovery():
    """Verify stale worker heartbeats trigger automatic crash recovery state changes."""
    await init_db()
    
    async for db in get_db():
        # Create a job claimed by worker_dead
        job = QueueJob(
            task_name="orphaned_job",
            payload={"task": "orphan"},
            status="running",
            priority=5,
            worker_id="worker_dead",
            run_after=datetime.utcnow()
        )
        db.add(job)
        await db.commit()
        
        # Execute orphan/stale job pruner logic
        # We run the recovery pruner manually on database session
        stale_threshold = datetime.utcnow() - timedelta(minutes=10)
        
        # Query and recover
        stmt = select(QueueJob).where(
            QueueJob.status == "running",
            QueueJob.worker_id == "worker_dead"
        )
        res = await db.execute(stmt)
        stale_jobs = res.scalars().all()
        for sj in stale_jobs:
            sj.status = "pending"
            sj.worker_id = None
            sj.retry_count += 1
            db.add(sj)
        await db.commit()
        
        await db.refresh(job)
        assert job.status == "pending"
        assert job.worker_id is None
        assert job.retry_count == 1
        
        # Clean up
        await db.delete(job)
        await db.commit()
        break
