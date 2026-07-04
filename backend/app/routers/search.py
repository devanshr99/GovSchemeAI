from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.services.search_engine import search_engine
from app.models.search_history import SearchHistory

router = APIRouter(prefix="/api/search", tags=["Intelligent Search"])


@router.get("")
async def search_schemes(
    q: Optional[str] = Query(None, description="Search query string"),
    state: Optional[str] = Query(None, description="Filter by state code"),
    category: Optional[str] = Query(None, description="Filter by category slug"),
    ministry: Optional[str] = Query(None, description="Filter by ministry name"),
    department: Optional[str] = Query(None, description="Filter by department name"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. active)"),
    age: Optional[int] = Query(None, description="Filter by beneficiary age eligibility"),
    gender: Optional[str] = Query(None, description="Filter by beneficiary gender eligibility"),
    income: Optional[float] = Query(None, description="Filter by maximum income eligibility limit"),
    sort_by: str = Query("relevance", description="Sorting criteria: relevance, newest, updated, alphabetical"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search schemes with expanded synonyms, fuzzy scoring, pagination, and multi-field filters.
    """
    filters = {
        "state": state,
        "category": category,
        "ministry": ministry,
        "department": department,
        "status": status,
        "age": age,
        "gender": gender,
        "income": income
    }
    # Clean dictionary of None values
    filters = {k: v for k, v in filters.items() if v is not None}

    results, total = await search_engine.search_schemes(
        db,
        query=q,
        filters=filters,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )

    return {
        "results": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/autocomplete")
async def get_autocomplete(
    prefix: str = Query(..., min_length=1, description="Search prefix string"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get typeahead query autocomplete suggestions.
    """
    suggestions = await search_engine.get_autocomplete(db, prefix)
    return {
        "prefix": prefix,
        "suggestions": suggestions
    }


@router.get("/history")
async def get_search_history(
    limit: int = Query(10, ge=1, le=100, description="Limit history entries returned"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve logs of recent queries searched.
    """
    stmt = select(SearchHistory).order_by(desc(SearchHistory.timestamp)).limit(limit)
    res = await db.execute(stmt)
    history = res.scalars().all()
    return [
        {
            "id": h.id,
            "query": h.query,
            "timestamp": h.timestamp.isoformat(),
            "results_count": h.results_count,
            "execution_time_ms": round(h.execution_time_ms, 2),
            "filters_used": h.filters_used
        } for h in history
    ]


@router.get("/analytics")
async def get_search_analytics(
    db: AsyncSession = Depends(get_db)
):
    """
    Aggregates dashboard stats metrics representing search performance.
    """
    return await search_engine.get_analytics(db)
