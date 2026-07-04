"""
Unit and Integration Tests for Version History & Audit Trail System (Phase 9).
"""

import pytest
from app.database import get_db, init_db
from app.services.sync_engine import sync_engine
from app.services.history_engine import history_engine
from app.models.scheme import Scheme
from app.models.history import SchemeVersion, AuditLog, FieldHistory
from sqlalchemy import select


@pytest.mark.asyncio
async def test_automatic_version_logging_on_sync():
    """Verify synchronization automatically records scheme versions, field diffs, and audit logs."""
    from app.database import get_db, init_db
    await init_db()

    payload_new = {
        "canonical_name": "Test History Yojana",
        "short_description": "Initial history desc.",
        "benefits": "Free training cover.",
        "eligibility": "Age 18-40.",
        "official_url": "https://history.gov.in"
    }

    async for db in get_db():
        # First Sync (INSERT)
        stats = await sync_engine.sync_batch(db, [payload_new], "scan_hist_01")
        assert stats["inserted"] == 1

        # Fetch the scheme
        stmt = select(Scheme).where(Scheme.name == "Test History Yojana")
        scheme = (await db.execute(stmt)).scalars().first()
        assert scheme is not None
        assert scheme.version == 1

        # Verify SchemeVersion log written
        stmt_ver = select(SchemeVersion).where(SchemeVersion.scheme_id == scheme.id)
        version = (await db.execute(stmt_ver)).scalars().first()
        assert version is not None
        assert version.version_number == 1
        assert version.change_type == "INSERT"
        assert version.scheme_data["benefits"] == "Free training cover."

        # Verify Audit Log
        stmt_audit = select(AuditLog).where(AuditLog.scheme_id == scheme.id)
        audit = (await db.execute(stmt_audit)).scalars().first()
        assert audit is not None
        assert audit.operation == "Scheme Created"

        # Update case (should trigger version increment, field history, and updates log)
        payload_up = {
            "canonical_name": "Test History Yojana",
            "short_description": "Updated history desc.",  # Changed!
            "benefits": "Free training + INR 1000 daily.",  # Changed!
            "eligibility": "Age 18-40.",
            "official_url": "https://history.gov.in"
        }

        stats_up = await sync_engine.sync_batch(db, [payload_up], "scan_hist_02")
        assert stats_up["updated"] == 1

        # Verify Scheme properties updated in DB
        await db.refresh(scheme)
        assert scheme.version == 2

        # Verify SchemeVersion v2 log written
        stmt_ver2 = select(SchemeVersion).where(
            (SchemeVersion.scheme_id == scheme.id) &
            (SchemeVersion.version_number == 2)
        )
        version2 = (await db.execute(stmt_ver2)).scalars().first()
        assert version2 is not None
        assert version2.change_type == "UPDATE"

        # Verify FieldHistory logged changed properties
        stmt_fh = select(FieldHistory).where(
            (FieldHistory.scheme_id == scheme.id) &
            (FieldHistory.field_name == "benefits")
        )
        fh = (await db.execute(stmt_fh)).scalars().first()
        assert fh is not None
        assert fh.old_value == "Free training cover."
        assert fh.new_value == "Free training + INR 1000 daily."

        # Clean up
        await db.delete(scheme)
        versions = (await db.execute(select(SchemeVersion).where(SchemeVersion.scheme_id == scheme.id))).scalars().all()
        for v in versions:
            await db.delete(v)
        audits = (await db.execute(select(AuditLog).where(AuditLog.scheme_id == scheme.id))).scalars().all()
        for a in audits:
            await db.delete(a)
        fhs = (await db.execute(select(FieldHistory).where(FieldHistory.scheme_id == scheme.id))).scalars().all()
        for f in fhs:
            await db.delete(f)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_rollback_preview_and_execute():
    """Verify administrator can preview rollback differences and execute rollback safely."""
    from app.database import get_db, init_db
    await init_db()

    payload_new = {
        "canonical_name": "Rollback Test Yojana",
        "short_description": "V1 description.",
        "benefits": "V1 benefits.",
        "eligibility": "Age 18-35.",
        "official_url": "https://rollback.gov.in"
    }

    async for db in get_db():
        # Clean up any pre-existing scheme to avoid test pollution
        stmt_clean = select(Scheme).where(Scheme.name == "Rollback Test Yojana")
        existing = (await db.execute(stmt_clean)).scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()

        # Step 1: Create Scheme (version 1)
        await sync_engine.sync_batch(db, [payload_new], "scan_rb_01")
        scheme = (await db.execute(select(Scheme).where(Scheme.name == "Rollback Test Yojana"))).scalars().first()
        assert scheme is not None
        assert scheme.version == 1

        # Step 2: Update Scheme (version 2)
        payload_up = {
            "canonical_name": "Rollback Test Yojana",
            "short_description": "V2 description.",  # Changed
            "benefits": "V2 benefits.",       # Changed
            "eligibility": "Age 18-35.",
            "official_url": "https://rollback.gov.in"
        }
        await sync_engine.sync_batch(db, [payload_up], "scan_rb_02")
        await db.refresh(scheme)
        assert scheme.version == 2

        # Step 3: Preview Rollback to version 1
        preview = await history_engine.preview_rollback(db, scheme.id, 1)
        assert preview["current_version"] == 2
        assert preview["target_version"] == 1
        assert "description" in preview["modified_fields"]
        assert "benefits" in preview["modified_fields"]
        assert preview["old_values"]["benefits"] == "V2 benefits."
        assert preview["new_values"]["benefits"] == "V1 benefits."

        # Step 4: Execute Rollback to version 1
        res = await history_engine.rollback_to_version(
            db, scheme_id=scheme.id, target_version=1, actor="admin_user", reason="Testing rollback"
        )
        assert res["status"] == "success"
        assert res["new_version"] == 3
        assert res["rolled_back_to"] == 1

        # Step 5: Verify production database scheme restored fields
        await db.refresh(scheme)
        assert scheme.version == 3
        assert scheme.description == "V1 description."
        assert scheme.benefits == "V1 benefits."

        # Verify Audit Log
        stmt_audit = select(AuditLog).where(
            (AuditLog.scheme_id == scheme.id) &
            (AuditLog.operation == "Rollback Executed")
        )
        audit = (await db.execute(stmt_audit)).scalars().first()
        assert audit is not None
        assert audit.actor == "admin_user"

        # Clean up
        await db.delete(scheme)
        versions = (await db.execute(select(SchemeVersion).where(SchemeVersion.scheme_id == scheme.id))).scalars().all()
        for v in versions:
            await db.delete(v)
        audits = (await db.execute(select(AuditLog).where(AuditLog.scheme_id == scheme.id))).scalars().all()
        for a in audits:
            await db.delete(a)
        fhs = (await db.execute(select(FieldHistory).where(FieldHistory.scheme_id == scheme.id))).scalars().all()
        for f in fhs:
            await db.delete(f)
        await db.commit()
        break
