"""
Schemes browsing/search API router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.scheme import SchemeListResponse, SchemeDetail
from app.services.scheme_service import scheme_service

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


# ── Schemas for write operations ──────────────────────────────────────────────

class SchemeStatusUpdate(BaseModel):
    is_active: bool


# ── Read endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=SchemeListResponse)
async def list_schemes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    level: Optional[str] = Query(None, pattern="^(central|state|district)$"),
    state: Optional[str] = Query(None, min_length=2, max_length=5),
    category: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = Query(None, min_length=1, max_length=200),
    active_only: Optional[bool] = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """Browse all schemes with pagination, filtering, and search."""
    return await scheme_service.list_schemes(
        db,
        page=page,
        page_size=page_size,
        level=level,
        state_code=state,
        category_slug=category,
        scheme_type=type,
        search=search,
        active_only=active_only if active_only is not None else False
    )


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all scheme categories."""
    return await scheme_service.get_categories(db)


@router.get("/{slug}", response_model=SchemeDetail)
async def get_scheme(slug: str, db: AsyncSession = Depends(get_db)):
    """Get full scheme detail by slug."""
    scheme = await scheme_service.get_scheme_by_slug(db, slug)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


# ── Write endpoints (Admin) ───────────────────────────────────────────────────

@router.patch("/{scheme_id}/status")
async def update_scheme_status(
    scheme_id: str,
    body: SchemeStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle scheme active/inactive status.
    Used by the admin panel to enable/disable scheme matching.
    """
    updated = await scheme_service.toggle_scheme_status(db, scheme_id, body.is_active)
    if not updated:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"id": scheme_id, "is_active": body.is_active, "message": "Status updated"}


@router.delete("/{scheme_id}")
async def delete_scheme(
    scheme_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a scheme from the database.
    This also cascades to associated eligibility rules.
    """
    deleted = await scheme_service.delete_scheme(db, scheme_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {"id": scheme_id, "message": "Scheme deleted successfully"}
