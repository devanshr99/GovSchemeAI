"""
Admin Government Sources API Router.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.source import SourceCreate, SourceUpdate, SourceDetail
from app.services.source_service import source_service

router = APIRouter(prefix="/api/admin/sources", tags=["Admin Sources"])


@router.get("", response_model=dict)
async def list_sources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all government source entries with pagination, category/state filtering, and search options.
    """
    sources, total = await source_service.list_sources(
        db, page=page, page_size=page_size, category=category, state=state, search=search
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "sources": [SourceDetail.model_validate(s) for s in sources]
    }


@router.get("/{source_id}", response_model=SourceDetail)
async def get_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve detailed record of a single government source by ID."""
    source = await source_service.get_source(db, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government source record not found."
        )
    return SourceDetail.model_validate(source)


@router.post("", response_model=SourceDetail, status_code=status.HTTP_201_CREATED)
async def create_source(body: SourceCreate, db: AsyncSession = Depends(get_db)):
    """Create a new trusted government source entry in the registry."""
    try:
        source = await source_service.create_source(db, body)
        return SourceDetail.model_validate(source)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{source_id}", response_model=SourceDetail)
async def update_source(source_id: str, body: SourceUpdate, db: AsyncSession = Depends(get_db)):
    """Update attributes of an existing government source record by ID."""
    try:
        source = await source_service.update_source(db, source_id, body)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Government source record not found."
            )
        return SourceDetail.model_validate(source)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{source_id}", status_code=status.HTTP_200_OK)
async def delete_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a government source registry entry permanently by ID."""
    deleted = await source_service.delete_source(db, source_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government source record not found."
        )
    return {"id": source_id, "message": "Government source deleted successfully."}


@router.post("/{source_id}/enable", response_model=SourceDetail)
async def enable_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Shortcut endpoint to enable a government source registry entry."""
    source = await source_service.toggle_source_status(db, source_id, is_active=True)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government source record not found."
        )
    return SourceDetail.model_validate(source)


@router.post("/{source_id}/disable", response_model=SourceDetail)
async def disable_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Shortcut endpoint to disable a government source registry entry."""
    source = await source_service.toggle_source_status(db, source_id, is_active=False)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government source record not found."
        )
    return SourceDetail.model_validate(source)
