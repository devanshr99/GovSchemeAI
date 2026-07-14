"""
Schemes browsing/search API router.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.scheme import SchemeListResponse, SchemeDetail
from app.services.scheme_service import scheme_service

logger = logging.getLogger("yojana.schemes")

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
    """Get full scheme detail by slug with dynamic AI summaries and recommendations."""
    scheme = await scheme_service.get_scheme_by_slug(db, slug)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    # 1. AI Summary Generation & Caching
    from app.services.cache import cache
    from app.services.ai_service import ai_service
    cache_key = f"scheme_ai_summary_{slug}"
    ai_summary = await cache.get(cache_key)
    if not ai_summary:
        try:
            prompt = (
                f"Provide a concise 2-sentence AI summary of the following government scheme "
                f"focusing on who it is for and its main benefit:\n"
                f"Name: {scheme.name}\n"
                f"Description: {scheme.description}\n"
                f"Benefits: {scheme.benefits or scheme.benefits_amount}"
            )
            ai_summary = await ai_service.generate(
                prompt,
                system_prompt="You are GovSchemeAI. Write a professional, highly readable summary in simple English. Keep it under 60 words.",
                max_tokens=150
            )
            if ai_summary:
                await cache.set(cache_key, ai_summary, ttl_seconds=86400.0)  # Cache for 24 hours
        except Exception as e:
            logger.warning(f"Failed to generate AI summary for {slug}: {e}")
            ai_summary = "AI summary is currently unavailable. Please review the details below."
    
    scheme.ai_summary = ai_summary

    # 2. Retrieve Related Schemes (same category, excluding this scheme)
    related_schemes = []
    try:
        from app.models.scheme import Scheme as SchemeModel, Category
        if scheme.category_name:
            stmt = (
                select(SchemeModel)
                .join(Category)
                .where(Category.name == scheme.category_name)
                .where(SchemeModel.slug != slug)
                .where(SchemeModel.is_active == True)
                .limit(3)
            )
            res = await db.execute(stmt)
            related_schemes = [scheme_service._to_card(s) for s in res.scalars().all()]
    except Exception as e:
        logger.warning(f"Failed to fetch related schemes for {slug}: {e}")
    
    scheme.related_schemes = related_schemes

    # 3. Retrieve Similar Schemes (same level, excluding this scheme and related schemes)
    similar_schemes = []
    try:
        from app.models.scheme import Scheme as SchemeModel
        exclude_ids = [scheme.id] + [r.id for r in related_schemes]
        stmt = (
            select(SchemeModel)
            .where(SchemeModel.level == scheme.level)
            .where(SchemeModel.id.notin_(exclude_ids))
            .where(SchemeModel.is_active == True)
            .limit(3)
        )
        res = await db.execute(stmt)
        similar_schemes = [scheme_service._to_card(s) for s in res.scalars().all()]
    except Exception as e:
        logger.warning(f"Failed to fetch similar schemes for {slug}: {e}")
    
    scheme.similar_schemes = similar_schemes

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
