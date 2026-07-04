"""
Locations API router — states and districts lookup.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.location import State, District

router = APIRouter(prefix="/api/locations", tags=["Locations"])


@router.get("/states")
async def get_states(db: AsyncSession = Depends(get_db)):
    """Get all Indian states and UTs."""
    result = await db.execute(select(State).order_by(State.name))
    states = result.scalars().all()
    return [
        {"code": s.code, "name": s.name, "name_hi": s.name_hi}
        for s in states
    ]


@router.get("/districts/{state_code}")
async def get_districts(state_code: str, db: AsyncSession = Depends(get_db)):
    """Get all districts for a state."""
    # Verify state exists
    state = await db.get(State, state_code.upper())
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    result = await db.execute(
        select(District)
        .where(District.state_code == state_code.upper())
        .order_by(District.name)
    )
    districts = result.scalars().all()
    return [
        {"id": d.id, "name": d.name, "name_hi": d.name_hi}
        for d in districts
    ]
