"""
Admin updates router — API endpoints to trigger scrapers, review logs, and manage updates.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.staging import UpdateRun, SchemeStagingEntry
from app.models.scheme import Scheme, EligibilityRule
from app.scheduler import get_scheduler_status
from app.scrapers.orchestrator import UpdateOrchestrator

logger = logging.getLogger("yojana.routers.admin_updates")
router = APIRouter(prefix="/api/admin/updates", tags=["Admin Updates"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class StagingReviewBody(BaseModel):
    notes: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    """Get the current scheduler cron status and next scheduled execution time."""
    return get_scheduler_status()


@router.post("/runs/trigger")
async def trigger_run(background_tasks: BackgroundTasks):
    """
    Trigger a manual scheme update pipeline run in the background.
    Returns immediately with run state info.
    """
    orchestrator = UpdateOrchestrator()
    # Execute orchestrator as a FastAPI background task
    background_tasks.add_task(orchestrator.run, run_type="manual")

    return {
        "status": "triggered",
        "message": "Scheme update pipeline has been triggered in the background."
    }


@router.get("/runs")
async def list_runs(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List update run logs ordered by start time."""
    stmt = select(UpdateRun).order_by(desc(UpdateRun.started_at)).limit(limit)
    res = await db.execute(stmt)
    runs = res.scalars().all()

    return [
        {
            "id": r.id,
            "run_type": r.run_type,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "status": r.status,
            "sources_scraped": r.sources_scraped,
            "total_fetched": r.total_fetched,
            "new_schemes": r.new_schemes,
            "updated_schemes": r.updated_schemes,
            "duplicates_skipped": r.duplicates_skipped,
            "errors": r.errors,
            "summary": r.summary
        }
        for r in runs
    ]


@router.get("/staging")
async def list_staging(
    status: str = Query("pending"),
    db: AsyncSession = Depends(get_db)
):
    """List entries inside the scheme staging table filterable by status."""
    stmt = select(SchemeStagingEntry).where(SchemeStagingEntry.status == status).order_by(desc(SchemeStagingEntry.created_at))
    res = await db.execute(stmt)
    entries = res.scalars().all()

    return [
        {
            "id": e.id,
            "source_name": e.source_name,
            "normalized_name": e.normalized_name,
            "match_type": e.match_type,
            "confidence_score": e.confidence_score,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in entries
    ]


@router.get("/staging/{entry_id}")
async def get_staging_detail(
    entry_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full staged candidate detail including the raw and normalized contents."""
    entry = await db.get(SchemeStagingEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Staged scheme entry not found")

    existing_scheme = None
    if entry.matched_scheme_id:
        existing_scheme = await db.get(Scheme, entry.matched_scheme_id)

    return {
        "id": entry.id,
        "source_name": entry.source_name,
        "source_url": entry.source_url,
        "source_id": entry.source_id,
        "match_type": entry.match_type,
        "confidence_score": entry.confidence_score,
        "status": entry.status,
        "review_notes": entry.review_notes,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "normalized_data": entry.normalized_data,
        "raw_data": entry.raw_data,
        "existing_scheme": {
            "name": existing_scheme.name,
            "description": existing_scheme.description,
            "benefits_amount": existing_scheme.benefits_amount,
            "ministry": existing_scheme.ministry
        } if existing_scheme else None
    }


@router.post("/staging/{entry_id}/approve")
async def approve_staging(
    entry_id: str,
    body: Optional[StagingReviewBody] = None,
    db: AsyncSession = Depends(get_db)
):
    """Approve a staged scheme update/new entry and write it to live database."""
    entry = await db.get(SchemeStagingEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Staged scheme entry not found")

    if entry.status in ("approved", "auto_applied"):
        raise HTTPException(status_code=400, detail="Entry is already approved/applied")

    try:
        orchestrator = UpdateOrchestrator()
        applied = await orchestrator._apply_staging_to_live(db, entry)

        if not applied:
            raise Exception("Promotion logic returned false")

        entry.status = "approved"
        entry.review_notes = body.notes if body else None
        entry.reviewed_at = datetime.utcnow()
        entry.applied_at = datetime.utcnow()

        await db.commit()
        return {"id": entry_id, "status": "approved", "message": "Scheme promoted to live registry successfully."}

    except Exception as e:
        logger.error(f"Approval failed for entry {entry_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Promotion failed: {e}")


@router.post("/staging/{entry_id}/reject")
async def reject_staging(
    entry_id: str,
    body: Optional[StagingReviewBody] = None,
    db: AsyncSession = Depends(get_db)
):
    """Mark a staged scheme entry as rejected to prevent promotion."""
    entry = await db.get(SchemeStagingEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Staged scheme entry not found")

    if entry.status in ("approved", "auto_applied"):
        raise HTTPException(status_code=400, detail="Cannot reject already applied entries")

    entry.status = "rejected"
    entry.review_notes = body.notes if body else None
    entry.reviewed_at = datetime.utcnow()

    await db.commit()
    return {"id": entry_id, "status": "rejected", "message": "Staged entry marked as rejected."}
