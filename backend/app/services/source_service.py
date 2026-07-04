"""
Government Source Service Repository.
Handles CRUD operations and custom business rules validations.
"""

import logging
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc

from app.models.source import GovernmentSource
from app.schemas.source import SourceCreate, SourceUpdate

logger = logging.getLogger("yojana.sources")


class SourceService:
    """
    Handles all business logic, validations, and storage operations for
    trusted government information sources.
    """

    async def get_source(self, db: AsyncSession, source_id: str) -> Optional[GovernmentSource]:
        """Retrieve a single government source by ID."""
        return await db.get(GovernmentSource, source_id)

    async def list_sources(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        state: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[GovernmentSource], int]:
        """
        List sources with pagination, category/state filtering, and search by name.
        Returns: Tuple[List[GovernmentSource], total_count]
        """
        # Base query
        stmt = select(GovernmentSource)
        count_stmt = select(func.count(GovernmentSource.id))

        # Filter by category
        if category:
            stmt = stmt.where(GovernmentSource.category == category)
            count_stmt = count_stmt.where(GovernmentSource.category == category)

        # Filter by state
        if state:
            stmt = stmt.where(GovernmentSource.state == state)
            count_stmt = count_stmt.where(GovernmentSource.state == state)

        # Search by name (case-insensitive)
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(GovernmentSource.name.ilike(search_term))
            count_stmt = count_stmt.where(GovernmentSource.name.ilike(search_term))

        # Get total count
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size).order_by(desc(GovernmentSource.created_at))

        res = await db.execute(stmt)
        sources = list(res.scalars().all())

        return sources, total

    async def create_source(self, db: AsyncSession, data: SourceCreate) -> GovernmentSource:
        """
        Creates a new government source.
        Validates duplicate names and URLs before persisting.
        """
        # Validate duplicate Name
        name_check = await db.execute(
            select(GovernmentSource).where(GovernmentSource.name == data.name)
        )
        if name_check.scalar_one_or_none():
            raise ValueError(f"A source with the name '{data.name}' already exists.")

        # Validate duplicate URL
        url_check = await db.execute(
            select(GovernmentSource).where(GovernmentSource.website_url == data.website_url)
        )
        if url_check.scalar_one_or_none():
            raise ValueError(f"A source with URL '{data.website_url}' already exists.")

        source = GovernmentSource(**data.model_dump())
        db.add(source)
        await db.commit()
        await db.refresh(source)
        return source

    async def update_source(self, db: AsyncSession, source_id: str, data: SourceUpdate) -> Optional[GovernmentSource]:
        """
        Updates an existing government source.
        Validates duplicate name and URL exclusions before saving.
        """
        source = await db.get(GovernmentSource, source_id)
        if not source:
            return None

        update_dict = data.model_dump(exclude_unset=True)

        # Validate name uniqueness if it's changing
        if "name" in update_dict and update_dict["name"] != source.name:
            name_check = await db.execute(
                select(GovernmentSource)
                .where(GovernmentSource.name == update_dict["name"])
                .where(GovernmentSource.id != source_id)
            )
            if name_check.scalar_one_or_none():
                raise ValueError(f"A source with the name '{update_dict['name']}' already exists.")

        # Validate website_url uniqueness if it's changing
        if "website_url" in update_dict and update_dict["website_url"] != source.website_url:
            url_check = await db.execute(
                select(GovernmentSource)
                .where(GovernmentSource.website_url == update_dict["website_url"])
                .where(GovernmentSource.id != source_id)
            )
            if url_check.scalar_one_or_none():
                raise ValueError(f"A source with URL '{update_dict['website_url']}' already exists.")

        for key, val in update_dict.items():
            setattr(source, key, val)

        await db.commit()
        await db.refresh(source)
        return source

    async def delete_source(self, db: AsyncSession, source_id: str) -> bool:
        """Permanently deletes a source record by ID. Returns True if successful."""
        source = await db.get(GovernmentSource, source_id)
        if not source:
            return False

        await db.delete(source)
        await db.commit()
        return True

    async def toggle_source_status(self, db: AsyncSession, source_id: str, is_active: bool) -> Optional[GovernmentSource]:
        """Toggles active/inactive flag for a source."""
        source = await db.get(GovernmentSource, source_id)
        if not source:
            return None

        source.is_active = is_active
        await db.commit()
        await db.refresh(source)
        return source


# Singleton
source_service = SourceService()
