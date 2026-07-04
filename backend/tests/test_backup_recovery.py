import os
import zipfile
import json
import pytest
import asyncio
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import select, text
from app.main import app
from app.config import get_settings
from app.database import get_db, init_db, async_session, engine, Base, failover_database_engine_async
from app.models.backup import BackupJob, BackupHistory, RestoreHistory, DisasterEvent, FailoverEvent
from app.models.scheme import Scheme
from app.services.backup_manager import backup_restore_manager
from app.services.failover_manager import failover_manager

client = TestClient(app)
settings = get_settings()
ADMIN_TOKEN = settings.jwt_secret or "govscheme-ai-dev-secret-change-in-prod"

@pytest.mark.asyncio
async def test_full_backup_and_restore_cycle():
    """Verify manual backup triggers zip generation, checksum verification, sanitizes envs, and recovers data."""
    await init_db()

    async for db in get_db():
        # Setup: Clean up any old record and create a test scheme
        from sqlalchemy import delete
        await db.execute(delete(Scheme).where(Scheme.slug == "backup-lifecycle-test-scheme"))
        await db.commit()

        test_scheme = Scheme(
            name="Backup Lifecycle Test Scheme",
            slug="backup-lifecycle-test-scheme",
            description="Detailed test description.",
            official_website="https://backup.gov.in",
            status="active"
        )
        db.add(test_scheme)
        await db.commit()
        await db.refresh(test_scheme)

        # 1. Trigger manual backup via API
        resp = client.post(f"/api/admin/backup/trigger?token={ADMIN_TOKEN}&backup_type=manual")
        assert resp.status_code == 200
        backup_data = resp.json()
        assert backup_data["status"] == "success"
        backup_id = backup_data["backup_id"]
        assert backup_data["checksum"] is not None

        # Verify backup metadata registered in database
        stmt = select(BackupHistory).where(BackupHistory.id == backup_id)
        history = (await db.execute(stmt)).scalar_one()
        assert history.status == "Completed"
        assert history.size_bytes > 0

        # Validate that the backup file is queryable locally (using local or simulated provider)
        provider = backup_restore_manager._get_provider(settings.backup_storage_provider)
        filename = history.backup_path.split("/")[-1]
        sim_file = provider.sim_dir / filename if hasattr(provider, "sim_dir") else Path(history.backup_path)
        assert os.path.exists(sim_file)

        # 2. Check Configuration Sanitization: read zip and inspect sanitized.env
        with zipfile.ZipFile(sim_file, "r") as z:
            assert "configs/sanitized.env" in z.namelist()
            env_content = z.read("configs/sanitized.env").decode("utf-8")
            assert "jwt_secret=[REDACTED]" in env_content or "JWT_SECRET=[REDACTED]" in env_content or "jwt_secret" not in env_content

        # 3. Simulate disaster: delete the test scheme
        await db.delete(test_scheme)
        await db.commit()

        # Verify scheme is gone
        check_deleted = await db.get(Scheme, test_scheme.id)
        assert check_deleted is None

        # 4. Trigger restore from backup ID
        restore_resp = client.post(
            f"/api/admin/backup/restore?token={ADMIN_TOKEN}&actor=test-runner",
            json={"backup_id": backup_id, "target": "full"}
        )
        assert restore_resp.status_code == 200
        restore_data = restore_resp.json()
        assert restore_data["status"] == "success"

        # Verify restore history record
        restore_stmt = select(RestoreHistory).where(RestoreHistory.id == restore_data["restore_id"])
        restore_log = (await db.execute(restore_stmt)).scalar_one()
        assert restore_log.status == "Completed"

        # Verify scheme has been fully restored to database!
        restored_scheme = await db.get(Scheme, test_scheme.id)
        assert restored_scheme is not None
        assert restored_scheme.name == "Backup Lifecycle Test Scheme"

        # Cleanup test records
        await db.delete(restored_scheme)
        await db.delete(restore_log)
        await db.delete(history)
        await db.commit()


@pytest.mark.asyncio
async def test_backup_checksum_corruption():
    """Verify that if a backup file is modified/corrupted, the restore engine fails checksum validation."""
    await init_db()

    async for db in get_db():
        # Trigger backup
        resp = client.post(f"/api/admin/backup/trigger?token={ADMIN_TOKEN}&backup_type=manual")
        backup_id = resp.json()["backup_id"]

        # Fetch backup path
        stmt = select(BackupHistory).where(BackupHistory.id == backup_id)
        history = (await db.execute(stmt)).scalar_one()

        # Intentionally corrupt the simulated backup file
        provider = backup_restore_manager._get_provider(settings.backup_storage_provider)
        filename = history.backup_path.split("/")[-1]
        sim_file = provider.sim_dir / filename if hasattr(provider, "sim_dir") else Path(history.backup_path)

        with open(sim_file, "a") as f:
            f.write("CORRUPTION_STAMP_123")

        # Try to restore - should fail with 400 Bad Request or 500 execution error due to mismatch
        restore_resp = client.post(
            f"/api/admin/backup/restore?token={ADMIN_TOKEN}&actor=test-runner",
            json={"backup_id": backup_id, "target": "full"}
        )
        assert restore_resp.status_code in (400, 500)
        assert "checksum" in restore_resp.json()["detail"].lower()

        # Clean up
        await db.delete(history)
        await db.commit()
        if os.path.exists(sim_file):
            os.remove(sim_file)


@pytest.mark.asyncio
async def test_database_heartbeat_and_automatic_failover():
    """Verify database heartbeat monitoring, automatic connection pool switchover, logging, and recovery validation."""
    await init_db()

    # Backup settings and set replica URL
    settings = get_settings()
    original_db_url = settings.database_url
    original_replica_url = settings.replica_database_url

    # For testing, replica URL will be a second SQLite in-memory file database URL
    test_replica_url = "sqlite+aiosqlite:///./govscheme_replica_test.db"
    settings.replica_database_url = test_replica_url

    # Pre-initialize schema tables on replica database
    from app.database import create_async_engine
    temp_engine = create_async_engine(test_replica_url)
    async with temp_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await temp_engine.dispose()

    try:
        # Trigger query check. Heartbeat is queryable, so primary_failed should remain False
        await failover_manager._check_database_availability()
        assert failover_manager.primary_failed is False

        # Simulate outage: mock session execution to fail on first execute call (heartbeat)
        # We start the patcher manually and stop it once inside the execute call so that
        # subsequent queries (failover recovery checks) run on the real replica database!
        patcher = patch("app.database.async_session")
        mock_session_maker = patcher.start()

        async def fail_and_stop_patcher(statement, *args, **kwargs):
            try:
                patcher.stop()
            except RuntimeError:
                pass
            raise Exception("Outage simulated")

        mock_session = AsyncMock()
        mock_session.execute = fail_and_stop_patcher
        mock_session_maker.return_value.__aenter__.return_value = mock_session

        # Run heartbeat check - should transition state and trigger failover
        await failover_manager._check_database_availability()
        assert failover_manager.primary_failed is True

        # Verify failover events were logged to the replica DB
        async for db in get_db():
            stmt = select(FailoverEvent).order_by(FailoverEvent.created_at.desc()).limit(1)
            event = (await db.execute(stmt)).scalar()
            assert event is not None
            assert event.status == "Succeeded"
            assert event.validated is True
            assert event.to_instance == test_replica_url

            # Clean up failover logs
            await db.delete(event)
            await db.commit()
    finally:
        # Revert database engine back to normal
        settings.database_url = original_db_url
        settings.replica_database_url = original_replica_url
        await failover_manager.stop_monitoring_daemon()
        await failover_database_engine_async(original_db_url)
