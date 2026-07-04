"""
Unit and Integration Tests for Database Synchronization Engine (Phase 8).
"""

import pytest
from app.services.sync_engine import sync_engine
from app.database import get_db, init_db
from app.models.scheme import Scheme
from app.models.audit import SyncAuditLog
from sqlalchemy import select


@pytest.mark.asyncio
async def test_sync_insert_and_update():
    """Verify synchronization inserts new schemes, updates existing properties, and increments versions."""
    from app.database import get_db, init_db
    await init_db()

    scan_id = "test_scan_101"
    new_scheme_payload = {
        "canonical_name": "Test Sync Yojana",
        "short_description": "First draft description.",
        "benefits": "Free training support.",
        "eligibility": "Youth age 18-35.",
        "required_documents": ["Aadhaar"],
        "official_url": "https://testyojana.gov.in",
        "ministry": "Ministry of Skill Development",
        "confidence_score": 0.95
    }

    async for db in get_db():
        # 1. Insert Case
        stats = await sync_engine.sync_batch(db, [new_scheme_payload], scan_id)
        assert stats["inserted"] == 1
        assert stats["updated"] == 0
        assert stats["status"] == "success"

        # Verify Scheme exists in DB
        stmt = select(Scheme).where(Scheme.name == "Test Sync Yojana")
        res = await db.execute(stmt)
        scheme = res.scalars().first()
        assert scheme is not None
        assert scheme.version == 1
        assert scheme.confidence_score == 0.95
        assert scheme.scan_id == scan_id

        # Verify Sync Audit Log exists
        stmt_audit = select(SyncAuditLog).where(SyncAuditLog.scheme_id == scheme.id)
        res_audit = await db.execute(stmt_audit)
        audit = res_audit.scalars().first()
        assert audit is not None
        assert audit.operation == "INSERT"
        assert audit.new_values["benefits"] == "Free training support."

        # 2. Update Case (change description and benefits)
        update_payload = {
            "canonical_name": "Test Sync Yojana",
            "short_description": "Updated draft description.",  # Changed!
            "benefits": "Free training and INR 1000 daily.",     # Changed!
            "eligibility": "Youth age 18-35.",
            "required_documents": ["Aadhaar"],
            "official_url": "https://testyojana.gov.in",
            "ministry": "Ministry of Skill Development",
            "confidence_score": 0.98
        }

        stats_up = await sync_engine.sync_batch(db, [update_payload], scan_id)
        assert stats_up["updated"] == 1
        assert stats_up["inserted"] == 0

        # Verify Scheme properties updated in DB
        await db.refresh(scheme)
        assert scheme.version == 2
        assert scheme.description == "Updated draft description."
        assert scheme.benefits == "Free training and INR 1000 daily."

        # Verify Update Audit Log
        stmt_audit_up = select(SyncAuditLog).where(
            (SyncAuditLog.scheme_id == scheme.id) &
            (SyncAuditLog.operation == "UPDATE")
        )
        res_audit_up = await db.execute(stmt_audit_up)
        audit_up = res_audit_up.scalars().first()
        assert audit_up is not None
        assert audit_up.previous_values["benefits"] == "Free training support."
        assert audit_up.new_values["benefits"] == "Free training and INR 1000 daily."

        # Clean up
        await db.delete(scheme)
        await db.execute(select(SyncAuditLog).where(SyncAuditLog.scheme_id == scheme.id))
        audits_to_delete = (await db.execute(select(SyncAuditLog).where(SyncAuditLog.scheme_id == scheme.id))).scalars().all()
        for a in audits_to_delete:
            await db.delete(a)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_sync_ignore_unchanged():
    """Verify synchronization ignores schemes if data matches database exactly."""
    from app.database import get_db, init_db
    await init_db()

    payload = {
        "canonical_name": "Test Sync Yojana Unchanged",
        "short_description": "Description matches.",
        "benefits": "INR 200 stipend.",
        "official_url": "https://unchanged.gov.in"
    }

    async for db in get_db():
        # First sync (inserts)
        await sync_engine.sync_batch(db, [payload], "scan_1")

        # Get the scheme
        stmt = select(Scheme).where(Scheme.name == "Test Sync Yojana Unchanged")
        scheme = (await db.execute(stmt)).scalars().first()
        assert scheme is not None
        assert scheme.version == 1

        # Second sync (should ignore)
        stats = await sync_engine.sync_batch(db, [payload], "scan_2")
        assert stats["inserted"] == 0
        assert stats["updated"] == 0

        # Verify version did not increment
        await db.refresh(scheme)
        assert scheme.version == 1

        # Verify IGNORE audit log was written
        stmt_ignore = select(SyncAuditLog).where(
            (SyncAuditLog.scheme_id == scheme.id) &
            (SyncAuditLog.operation == "IGNORE")
        )
        ignore_audit = (await db.execute(stmt_ignore)).scalars().first()
        assert ignore_audit is not None

        # Clean up
        await db.delete(scheme)
        audits = (await db.execute(select(SyncAuditLog).where(SyncAuditLog.scheme_id == scheme.id))).scalars().all()
        for a in audits:
            await db.delete(a)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_sync_deactivation():
    """Verify schemes missing from the batch are marked inactive."""
    from app.database import get_db, init_db
    await init_db()

    async for db in get_db():
        # Clean up target schemes if they exist
        stmt_cleanup = select(Scheme).where(
            (Scheme.name == "Deactivate Target Yojana") |
            (Scheme.name == "Some Other Active Yojana")
        )
        existing = (await db.execute(stmt_cleanup)).scalars().all()
        for s in existing:
            await db.delete(s)
        await db.commit()

        # Temporarily clear source_url for other schemes so they are ignored by deactivation check
        stmt_others = select(Scheme).where(Scheme.name != "Deactivate Target Yojana")
        others = (await db.execute(stmt_others)).scalars().all()
        original_urls = {o.id: o.source_url for o in others}
        for o in others:
            o.source_url = None
        await db.commit()

        # Insert a crawl-sourced scheme
        active_scheme = Scheme(
            name="Deactivate Target Yojana",
            slug="deactivate-target-yojana",
            source_url="https://source.gov.in/scheme",
            is_active=True,
            status="active"
        )
        db.add(active_scheme)
        await db.commit()
        await db.refresh(active_scheme)

        # Run sync batch that does NOT include this scheme
        # (This simulates the scheme being missing from trusted official sources)
        batch_payloads = [
            {
                "canonical_name": "Some Other Active Yojana",
                "short_description": "Description.",
                "benefits": "Benefits details.",
                "official_url": "https://other.gov.in"
            }
        ]

        # Override threshold to 1 for deactivation validation
        from app.config import get_settings
        settings = get_settings()
        old_threshold = settings.inactive_missing_scans_threshold
        settings.inactive_missing_scans_threshold = 1

        try:
            stats = await sync_engine.sync_batch(db, batch_payloads, "scan_deact_test")
            assert stats["deactivated"] == 1
        finally:
            settings.inactive_missing_scans_threshold = old_threshold

        # Verify Target Yojana is now deactivated
        await db.refresh(active_scheme)
        assert active_scheme.is_active is False
        assert active_scheme.status == "inactive"

        # Verify Deactivation Audit Log
        from app.models.history import AuditLog as HistoryAuditLog
        stmt_audit = select(HistoryAuditLog).where(
            (HistoryAuditLog.scheme_id == active_scheme.id) &
            (HistoryAuditLog.operation == "Scheme Inactivated")
        )
        deact_audit = (await db.execute(stmt_audit)).scalars().first()
        assert deact_audit is not None

        # Clean up
        await db.delete(active_scheme)
        other_scheme = (await db.execute(select(Scheme).where(Scheme.slug == "some-other-active-yojana"))).scalars().first()
        if other_scheme:
            await db.delete(other_scheme)
        
        # Clean up lifecycle entry
        from app.models.lifecycle import SchemeLifecycle
        lc = (await db.execute(select(SchemeLifecycle).where(SchemeLifecycle.scheme_id == active_scheme.id))).scalars().first()
        if lc:
            await db.delete(lc)

        # Restore source_urls
        stmt_all = select(Scheme)
        all_schemes = (await db.execute(stmt_all)).scalars().all()
        for s in all_schemes:
            if s.id in original_urls:
                s.source_url = original_urls[s.id]
        await db.commit()
        break


@pytest.mark.asyncio
async def test_sync_transaction_rollback():
    """Verify sync rolls back all changes in the batch if one element fails validation/database write."""
    from app.database import get_db, init_db
    await init_db()

    payload_valid = {
        "canonical_name": "Sync Yojana Valid Target",
        "short_description": "Valid description details.",
        "benefits": "Free medicine.",
        "official_url": "https://valid.gov.in"
    }

    # This payload has an invalid structure that will crash database constraints
    # (scheme_name/name is missing, which is a Not Null constraint)
    payload_invalid = {
        "canonical_name": None,
        "short_description": "Will cause database exception.",
    }

    async for db in get_db():
        # Clean up any pre-existing scheme to avoid test pollution
        stmt_cleanup = select(Scheme).where(Scheme.name == "Sync Yojana Valid Target")
        existing = (await db.execute(stmt_cleanup)).scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()

        # Inject invalid mock name forcing exception
        # Attempt to sync batch
        stats = await sync_engine.sync_batch(db, [payload_valid, payload_invalid], "scan_rollback_test")

        assert stats["status"] == "failed"
        assert stats["error"] is not None

        # Verify that even the valid scheme was NOT inserted (rollback verified)
        stmt = select(Scheme).where(Scheme.name == "Sync Yojana Valid Target")
        scheme = (await db.execute(stmt)).scalars().first()
        assert scheme is None

        # Verify Rollback Audit Log was written
        stmt_rollback = select(SyncAuditLog).where(SyncAuditLog.operation == "ROLLBACK")
        rollback_audit = (await db.execute(stmt_rollback)).scalars().first()
        assert rollback_audit is not None
        assert "failed" in rollback_audit.details.lower()

        # Clean up rollback audits
        audits = (await db.execute(select(SyncAuditLog).where(SyncAuditLog.operation == "ROLLBACK"))).scalars().all()
        for a in audits:
            await db.delete(a)
        await db.commit()
        break
