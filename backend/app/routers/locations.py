"""
Locations API router — states and districts lookup.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

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
    code_upper = state_code.strip().upper()
    
    result = await db.execute(
        select(District)
        .where(or_(District.state_code == code_upper, District.state_code == state_code))
        .order_by(District.name)
    )
    districts = result.scalars().all()

    if not districts:
        # Fallback check if state_code passed is state name e.g. "Uttar Pradesh"
        result = await db.execute(
            select(District)
            .join(State, District.state_code == State.code)
            .where(State.name.ilike(f"%{state_code}%"))
            .order_by(District.name)
        )
        districts = result.scalars().all()

    return [
        {"id": d.id, "name": d.name, "name_hi": d.name_hi}
        for d in districts
    ]
