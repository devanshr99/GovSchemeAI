"""
Unit and Integration Tests for Scheme Lifecycle Management & Inactive Detection (Phase 10).
"""

import pytest
from datetime import date, datetime, timedelta
from app.database import get_db, init_db
from app.services.sync_engine import sync_engine
from app.services.lifecycle_engine import lifecycle_engine
from app.models.scheme import Scheme
from app.models.lifecycle import SchemeLifecycle, SchemeStatusHistory
from sqlalchemy import select


@pytest.mark.asyncio
async def test_expired_detection_rule():
    """Verify schemes past their deadline date are automatically transitioned to expired."""
    from app.database import get_db, init_db
    await init_db()

    async for db in get_db():
        # Clean up target scheme if exists
        stmt_cleanup = select(Scheme).where(Scheme.name == "Expired Deadline Scheme")
        existing = (await db.execute(stmt_cleanup)).scalars().all()
        for s in existing:
            await db.delete(s)
        await db.commit()

        # Temporarily clear source_url for other schemes so they are ignored by deactivation check
        stmt_others = select(Scheme).where(Scheme.name != "Expired Deadline Scheme")
        others = (await db.execute(stmt_others)).scalars().all()
        original_urls = {o.id: o.source_url for o in others}
        for o in others:
            o.source_url = None
        await db.commit()

        # Create a scheme with an expired deadline (yesterday)
        expired_date = date.today() - timedelta(days=1)
        scheme = Scheme(
            name="Expired Deadline Scheme",
            slug="expired-deadline-scheme",
            deadline=expired_date,
            is_active=True,
            status="active"
        )
        db.add(scheme)
        await db.commit()
        await db.refresh(scheme)

        # Evaluate lifecycle events
        stats = await lifecycle_engine.evaluate_lifecycle_events(db, "scan_expire_test")
        assert stats["expired"] == 1

        # Verify state updated in DB
        await db.refresh(scheme)
        assert scheme.is_active is False
        assert scheme.status == "expired"

        # Verify status history log written
        stmt = select(SchemeStatusHistory).where(SchemeStatusHistory.scheme_id == scheme.id)
        hist = (await db.execute(stmt)).scalars().first()
        assert hist is not None
        assert hist.old_status == "active"
        assert hist.new_status == "expired"

        # Clean up
        await db.delete(scheme)
        hist_records = (await db.execute(select(SchemeStatusHistory).where(SchemeStatusHistory.scheme_id == scheme.id))).scalars().all()
        for h in hist_records:
            await db.delete(h)

        # Restore source_urls
        stmt_all = select(Scheme)
        all_schemes = (await db.execute(stmt_all)).scalars().all()
        for s in all_schemes:
            if s.id in original_urls:
                s.source_url = original_urls[s.id]
        await db.commit()
        break


@pytest.mark.asyncio
async def test_withdrawn_text_detection_during_sync():
    """Verify crawl texts containing withdrawn keywords transition statuses to withdrawn immediately."""
    from app.database import get_db, init_db
    await init_db()

    # Clean text has discontinued keyword
    payload = {
        "canonical_name": "Withdrawn Test Yojana",
        "short_description": "A discontinued scheme description.",
        "benefits": "INR 500.",
        "official_url": "https://withdrawn.gov.in",
        "clean_text": "Important notice: This scheme is discontinued and closed permanently from June 2026."
    }

    async for db in get_db():
        stats = await sync_engine.sync_batch(db, [payload], "scan_withdrawn_test")
        assert stats["inserted"] == 1

        # Verify scheme created as withdrawn and inactive
        stmt = select(Scheme).where(Scheme.name == "Withdrawn Test Yojana")
        scheme = (await db.execute(stmt)).scalars().first()
        assert scheme is not None
        assert scheme.status == "withdrawn"
        assert scheme.is_active is False

        # Clean up
        await db.delete(scheme)
        await db.commit()
        break


@pytest.mark.asyncio
async def test_inactive_detection_scan_threshold():
    """Verify schemes missing from scans are deactivated only after reaching the threshold consecutive scans count."""
    from app.database import get_db, init_db
    await init_db()

    async for db in get_db():
        # Clean up target scheme if exists
        stmt_cleanup = select(Scheme).where(Scheme.name == "Threshold Deactivate Scheme")
        existing = (await db.execute(stmt_cleanup)).scalars().all()
        for s in existing:
            await db.delete(s)
        await db.commit()

        # Temporarily clear source_url for other schemes so they are ignored by deactivation check
        stmt_others = select(Scheme).where(Scheme.name != "Threshold Deactivate Scheme")
        others = (await db.execute(stmt_others)).scalars().all()
        original_urls = {o.id: o.source_url for o in others}
        for o in others:
            o.source_url = None
        await db.commit()

        # Create a crawl-sourced active scheme
        scheme = Scheme(
            name="Threshold Deactivate Scheme",
            slug="threshold-deactivate-scheme",
            source_url="https://threshold.gov.in/scheme",
            is_active=True,
            status="active"
        )
        db.add(scheme)
        await db.commit()
        await db.refresh(scheme)

        # Scan 1 to 4: Scheme is missing (different scan IDs)
        # Should increment missing count but keep it active
        for i in range(1, 5):
            stats = await lifecycle_engine.evaluate_lifecycle_events(db, f"scan_run_{i}", max_missing_scans=5)
            assert stats["deactivated"] == 0
            await db.commit()
            await db.refresh(scheme)
            assert scheme.is_active is True
            assert scheme.status == "active"

            # Check missing counter
            stmt_lc = select(SchemeLifecycle).where(SchemeLifecycle.scheme_id == scheme.id)
            lc = (await db.execute(stmt_lc)).scalars().first()
            assert lc.consecutive_missing_scans == i

        # Scan 5: missing count reaches 5. Should deactivate.
        stats_final = await lifecycle_engine.evaluate_lifecycle_events(db, "scan_run_5", max_missing_scans=5)
        assert stats_final["deactivated"] == 1

        await db.commit()
        await db.refresh(scheme)
        assert scheme.is_active is False
        assert scheme.status == "inactive"
        assert scheme.last_checked is not None

        # Verify status history log written
        stmt_hist = select(SchemeStatusHistory).where(SchemeStatusHistory.scheme_id == scheme.id)
        hist = (await db.execute(stmt_hist)).scalars().first()
        assert hist is not None
        assert hist.old_status == "active"
        assert hist.new_status == "inactive"

        # Clean up
        await db.delete(scheme)
        lc_records = (await db.execute(select(SchemeLifecycle).where(SchemeLifecycle.scheme_id == scheme.id))).scalars().all()
        for l in lc_records:
            await db.delete(l)
        hist_records = (await db.execute(select(SchemeStatusHistory).where(SchemeStatusHistory.scheme_id == scheme.id))).scalars().all()
        for h in hist_records:
            await db.delete(h)

        # Restore source_urls
        stmt_all = select(Scheme)
        all_schemes = (await db.execute(stmt_all)).scalars().all()
        for s in all_schemes:
            if s.id in original_urls:
                s.source_url = original_urls[s.id]
        await db.commit()
        break
