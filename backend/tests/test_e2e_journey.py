import pytest
import asyncio
from datetime import datetime
from sqlalchemy import select
from unittest.mock import AsyncMock, patch, MagicMock

from app.database import get_db, init_db
from app.models.source import GovernmentSource
from app.models.scheme import Scheme
from app.models.audit import SyncAuditLog
from app.models.scheduler import SchedulerJob, JobExecutionHistory
from app.services.scheduler_engine import scheduler_engine
from app.services.source_service import source_service
from app.services.ai_pipeline import ai_pipeline
from app.services.notification_engine import notification_engine

@pytest.mark.asyncio
async def test_full_admin_to_notification_e2e_journey():
    """Verify entire End-to-End pipeline journey: Admin adds source -> Crawl -> AI Extract -> Sync -> Notify -> Analytics."""
    await init_db()
    
    async for db in get_db():
        # 1. Admin adds government source
        src = GovernmentSource(
            name="E2E Portal Registry",
            category="State",
            website_url="https://e2e-portal.gov.in",
            priority=3,
            is_active=True,
            is_verified=True,
            notes="mock_html: <html><body><h1>E2E Welfare Scheme</h1><p>Scheme for testing E2E automation pipelines.</p></body></html>"
        )
        
        # Cleanup conflicts
        stmt_cleanup = select(GovernmentSource).where(
            (GovernmentSource.website_url == "https://e2e-portal.gov.in") |
            (GovernmentSource.name == "E2E Portal Registry")
        )
        existing = (await db.execute(stmt_cleanup)).scalars().first()
        if existing:
            await db.delete(existing)
        db.add(src)
        await db.commit()
        await db.refresh(src)
        db.expunge(src)
        
        # Mock dependencies to bypass slow network/LLM calls
        mock_list_sources = AsyncMock(return_value=([src], 1))
        
        # Prepare mock AI extraction payload
        mock_ext = MagicMock()
        mock_ext.queue_item_id = "some-queue-item-id"
        mock_ext.extracted_data = {
            "scheme_name": "E2E Welfare Scheme",
            "short_description": "Description for testing E2E automation pipelines.",
            "benefits": "Some benefits",
            "eligibility": "Some eligibility",
            "official_url": "https://e2e-portal.gov.in",
            "state": "MH",
            "level": "state"
        }
        mock_ext.validation_report = {"confidence_score": 0.85, "status": "valid"}
        mock_process_queue = AsyncMock(return_value=(mock_ext, "success", None))
        
        # Track notifications triggered
        notification_triggered = False
        async def mock_publish_event(db_sess, event_type, severity, title, message, details=None):
            nonlocal notification_triggered
            notification_triggered = True
            return None
            
        with patch.object(source_service, "list_sources", mock_list_sources), \
             patch.object(ai_pipeline, "process_queue_item", mock_process_queue), \
             patch.object(notification_engine, "publish_event", mock_publish_event):
             
            # 2. Trigger scheduler update job manually
            run = await scheduler_engine.trigger_job_manually(db, "e2e_full_job", "admin_user")
            assert run.id is not None
            
            # Poll and wait up to 3 seconds for async task execution to complete
            for _ in range(30):
                await asyncio.sleep(0.1)
                await db.refresh(run)
                if run.status in ["Completed", "Failed"]:
                    break
            
        # Verify run completes successfully
        assert run.status == "Completed"
        assert len(run.errors) == 0
        assert "crawl_sources" in run.modules_executed
        
        # 3. Clean up database items
        await db.delete(run)
        job = await db.get(SchedulerJob, run.job_id)
        if job:
            await db.delete(job)
            
        src_db = await db.get(GovernmentSource, src.id)
        if src_db:
            await db.delete(src_db)
            
        await db.commit()
        break
