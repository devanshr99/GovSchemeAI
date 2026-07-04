import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.config import get_settings
from app.database import get_db, init_db
from app.models.source import GovernmentSource

client = TestClient(app)
settings = get_settings()
ADMIN_TOKEN = settings.jwt_secret or "govscheme-ai-dev-secret-change-in-prod"


def test_dashboard_authorization():
    """Verify unauthorized requests without proper admin tokens return 401."""
    # Stats API unauthorized
    resp = client.get("/api/admin/dashboard/stats")
    assert resp.status_code == 401

    # View unauthorized
    resp = client.get("/api/admin/dashboard/view")
    assert resp.status_code == 401

    # Logs unauthorized
    resp = client.get("/api/admin/dashboard/logs")
    assert resp.status_code == 401


def test_dashboard_stats_aggregation():
    """Verify stats endpoint returns successfully and maps all 10 core components."""
    resp = client.get(f"/api/admin/dashboard/stats?token={ADMIN_TOKEN}")
    assert resp.status_code == 200
    data = resp.json()

    assert "system" in data
    assert "sources" in data
    assert "crawler" in data
    assert "ai" in data
    assert "sync" in data
    assert "lifecycle" in data
    assert "scheduler" in data
    assert "queue" in data
    assert "notifications" in data

    assert data["system"]["db_status"] == "Healthy"


def test_dashboard_logs_search():
    """Verify logs endpoint searches and filters in-memory logged records successfully."""
    # Log a specific test message manually to the memory buffer to bypass pytest intercepts
    import logging
    from app.routers.dashboard import memory_log_handler
    record = logging.LogRecord(
        name="govscheme.test.dashboard",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="DASHBOARD_TEST_MESSAGE_UNIQUE_STAMP",
        args=(),
        exc_info=None
    )
    memory_log_handler.emit(record)

    # Fetch logs with search query
    resp = client.get(f"/api/admin/dashboard/logs?token={ADMIN_TOKEN}&search=DASHBOARD_TEST_MESSAGE_UNIQUE_STAMP")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert "DASHBOARD_TEST_MESSAGE_UNIQUE_STAMP" in data[0]["message"]


@pytest.mark.asyncio
async def test_dashboard_actions_and_toggles():
    """Verify admin source state toggle and crawl triggers operate successfully."""
    await init_db()

    async for db in get_db():
        # Setup: Create a test source
        src = GovernmentSource(
            name="Dashboard Toggle Src",
            category="State",
            website_url="https://dashboard-toggle.gov.in",
            priority=3,
            is_active=True
        )
        db.add(src)
        await db.commit()
        await db.refresh(src)

        # 1. Toggle source (deactivate)
        resp = client.post(f"/api/admin/dashboard/sources/{src.id}/toggle?token={ADMIN_TOKEN}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["is_active"] is False

        # Verify database updated
        await db.refresh(src)
        assert src.is_active is False

        # 2. Refresh source (enqueue manual crawl task)
        resp2 = client.post(f"/api/admin/dashboard/sources/{src.id}/refresh?token={ADMIN_TOKEN}")
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["status"] == "enqueued"
        assert "job_id" in data2

        # Clean up
        from app.models.queue_system import QueueJob
        job_id = data2["job_id"]
        job_record = await db.get(QueueJob, job_id)
        if job_record:
            await db.delete(job_record)
        await db.delete(src)
        await db.commit()
        break
