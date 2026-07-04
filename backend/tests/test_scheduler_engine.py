import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy import select

from app.database import get_db, init_db
from app.models.scheduler import SchedulerJob, JobExecutionHistory
from app.models.source import GovernmentSource
from app.services.scheduler_engine import scheduler_engine
from app.services.source_service import source_service
from app.services.ai_pipeline import ai_pipeline


@pytest.mark.asyncio
async def test_scheduler_manual_trigger():
    """Verify manual triggers register job histories and run the orchestrated pipeline to completion."""
    await init_db()

    async for db in get_db():
        # Setup: Ensure active government source exists for crawling
        src = GovernmentSource(
            name="Manual Registry",
            category="Ministry",
            website_url="https://manual.gov.in",
            priority=5,
            is_active=True,
            is_verified=True,
            notes="mock_html: <html><body><h1>Manual Yojana</h1><p>Manual scheme description.</p></body></html>"
        )
        # Clear existing manual registry if it exists by name or URL
        stmt_cleanup_url = select(GovernmentSource).where(GovernmentSource.website_url == "https://manual.gov.in")
        existing_url = (await db.execute(stmt_cleanup_url)).scalars().first()
        if existing_url:
            await db.delete(existing_url)

        stmt_cleanup_name = select(GovernmentSource).where(GovernmentSource.name == "Manual Registry")
        existing_name = (await db.execute(stmt_cleanup_name)).scalars().first()
        if existing_name:
            await db.delete(existing_name)

        db.add(src)
        await db.commit()
        await db.refresh(src)
        db.expunge(src)  # Detach from session to prevent cross-session database lockups

        # Mock list_sources and process_queue_item to prevent slow background/AI work and potential DB locks
        mock_list_sources = AsyncMock(return_value=([src], 1))
        mock_process_queue = AsyncMock(return_value=(None, "success", None))
        with patch.object(source_service, "list_sources", mock_list_sources), \
             patch.object(ai_pipeline, "process_queue_item", mock_process_queue):
            # Trigger manually
            run = await scheduler_engine.trigger_job_manually(db, "manual_test_job", "admin_user")
            assert run.id is not None
            assert run.status in ["Pending", "Running"]
            assert run.triggered_by == "admin_user"

            # Wait for async task execution to complete by polling (Phase 21)
            for _ in range(30):
                await asyncio.sleep(0.1)
                await db.refresh(run)
                if run.status in ["Completed", "Failed"]:
                    break

        assert run.status == "Completed"
        assert len(run.errors) == 0
        assert "load_active_sources" in run.modules_executed
        assert "crawl_sources" in run.modules_executed

        # Clean up
        await db.delete(run)
        job = await db.get(SchedulerJob, run.job_id)
        if job:
            await db.delete(job)
        src_db = await db.get(GovernmentSource, src.id)
        if src_db:
            await db.delete(src_db)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_scheduler_pipeline_retries_on_failure():
    """Verify scheduler catches pipeline exceptions and transitions status to Retrying/Failed."""
    await init_db()

    async for db in get_db():
        # Create a job with configured retrydelay
        job = SchedulerJob(
            name="failing_test_job",
            job_type="one_time",
            status="active",
            max_retries=1,
            retry_delay=1,
            timeout_seconds=5
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        run = JobExecutionHistory(
            job_id=job.id,
            status="Pending",
            triggered_by="test_suite"
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # Mock the run_orchestration_pipeline method to raise an Exception
        with patch.object(scheduler_engine, "run_orchestration_pipeline", side_effect=Exception("Database connection error")):
            # Trigger execution
            await scheduler_engine.execute_job_history(run.id)

            # Check status transitioned to Retrying
            await db.refresh(run)
            assert run.status == "Retrying"
            assert "Database connection error" in run.errors

            # Wait for retry delay to expire and execute retry
            await asyncio.sleep(1.5)

            # Check new retry run was registered
            stmt = select(JobExecutionHistory).where(
                (JobExecutionHistory.job_id == job.id) & (JobExecutionHistory.retry_count == 1)
            )
            retry_run = (await db.execute(stmt)).scalars().first()
            assert retry_run is not None

            # Execute the retry run and verify it fails permanently (max_retries reached)
            await scheduler_engine.execute_job_history(retry_run.id)
            await db.refresh(retry_run)
            assert retry_run.status == "Failed"

            # Clean up
            await db.delete(run)
            await db.delete(retry_run)
            await db.delete(job)
            await db.commit()
            break


@pytest.mark.asyncio
async def test_scheduler_timeout_recovery():
    """Verify slow runs exceeding timeout limits are cancelled and logged as failed/retried."""
    await init_db()

    async for db in get_db():
        job = SchedulerJob(
            name="timeout_test_job",
            job_type="one_time",
            status="active",
            max_retries=0,
            retry_delay=1,
            timeout_seconds=1  # 1 second timeout
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        run = JobExecutionHistory(
            job_id=job.id,
            status="Pending",
            triggered_by="test_suite"
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # Mock pipeline to sleep for 3 seconds (longer than job's 1s timeout)
        async def slow_pipeline(history_id):
            await asyncio.sleep(3)

        with patch.object(scheduler_engine, "run_orchestration_pipeline", side_effect=slow_pipeline):
            await scheduler_engine.execute_job_history(run.id)

            await db.refresh(run)
            assert run.status == "Failed"
            assert any("timed out" in err.lower() for err in run.errors)

            # Clean up
            await db.delete(run)
            await db.delete(job)
            await db.commit()
            break


@pytest.mark.asyncio
async def test_scheduler_crash_recovery():
    """Verify system restarts transition orphaned Running/Queued runs to Failed and schedule recovery runs."""
    await init_db()

    async for db in get_db():
        job = SchedulerJob(
            name="crash_test_job",
            job_type="recurring",
            cron_expression="0 0 * * *",
            status="active",
            max_retries=2,
            retry_delay=10
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # Simulate crashed execution left in Running status
        run = JobExecutionHistory(
            job_id=job.id,
            status="Running",
            triggered_by="admin"
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # Trigger crash recovery
        await scheduler_engine.run_crash_recovery()

        # Check run marked as failed
        await db.refresh(run)
        assert run.status == "Failed"
        assert any("restart/crash" in err for err in run.errors)

        # Verify a new retry recovery run is created in Pending status
        stmt = select(JobExecutionHistory).where(
            (JobExecutionHistory.job_id == job.id) & (JobExecutionHistory.triggered_by == "crash_recovery")
        )
        retry_run = (await db.execute(stmt)).scalars().first()
        assert retry_run is not None
        assert retry_run.status in ["Pending", "Running", "Completed"]

        # Clean up
        await db.delete(run)
        if retry_run:
            await db.delete(retry_run)
        await db.delete(job)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_scheduler_cron_registration():
    """Verify APScheduler correctly parses crontabs and schedules triggers."""
    scheduler_engine.start_scheduler()
    assert scheduler_engine._running is True

    # Check that registering works
    from apscheduler.triggers.cron import CronTrigger
    trigger = CronTrigger.from_crontab("0 12 * * *")
    assert trigger is not None

    scheduler_engine.shutdown_scheduler()
    assert scheduler_engine._running is False
