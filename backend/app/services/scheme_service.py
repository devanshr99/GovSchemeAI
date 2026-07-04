"""
Scheme service — CRUD, search, filtering for schemes.
"""

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, cast, String
from sqlalchemy.orm import selectinload

from app.models.scheme import Scheme, Category
from app.schemas.scheme import SchemeCard, SchemeDetail, SchemeListResponse

logger = logging.getLogger("yojana.schemes")


class SchemeService:

    async def list_schemes(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        level: Optional[str] = None,
        state_code: Optional[str] = None,
        category_slug: Optional[str] = None,
        scheme_type: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True,
    ) -> SchemeListResponse:
        """List schemes with pagination, filtering, and search."""

        # Base query
        stmt = select(Scheme).options(selectinload(Scheme.category))
        count_stmt = select(func.count(Scheme.id))

        if active_only:
            stmt = stmt.where(Scheme.is_active == True)
            count_stmt = count_stmt.where(Scheme.is_active == True)

        if level:
            stmt = stmt.where(Scheme.level == level)
            count_stmt = count_stmt.where(Scheme.level == level)

        if state_code:
            # Central schemes apply to all states
            stmt = stmt.where(
                or_(Scheme.state_code == state_code, Scheme.level == "central")
            )
            count_stmt = count_stmt.where(
                or_(Scheme.state_code == state_code, Scheme.level == "central")
            )

        if category_slug:
            stmt = stmt.join(Category).where(Category.slug == category_slug)
            count_stmt = count_stmt.join(Category).where(Category.slug == category_slug)

        if scheme_type:
            # scheme_type is a JSON column (list of strings).
            # SQLite stores JSON as text, so we use LIKE to check if the value exists.
            type_pattern = f'%"{scheme_type}"%'
            stmt = stmt.where(cast(Scheme.scheme_type, String).like(type_pattern))
            count_stmt = count_stmt.where(cast(Scheme.scheme_type, String).like(type_pattern))

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Scheme.name.ilike(search_term),
                    Scheme.name_hi.ilike(search_term),
                    Scheme.description.ilike(search_term),
                    Scheme.ministry.ilike(search_term),
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    Scheme.name.ilike(search_term),
                    Scheme.name_hi.ilike(search_term),
                    Scheme.description.ilike(search_term),
                    Scheme.ministry.ilike(search_term),
                )
            )

        # Get total count
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size).order_by(Scheme.name)

        result = await db.execute(stmt)
        schemes = result.scalars().all()

        return SchemeListResponse(
            total=total,
            page=page,
            page_size=page_size,
            schemes=[self._to_card(s) for s in schemes],
        )

    async def get_scheme_by_slug(
        self, db: AsyncSession, slug: str
    ) -> Optional[SchemeDetail]:
        """Get full scheme detail by slug."""
        stmt = (
            select(Scheme)
            .where(Scheme.slug == slug)
            .options(
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.category),
            )
        )
        result = await db.execute(stmt)
        scheme = result.scalar_one_or_none()
        if not scheme:
            return None
        return self._to_detail(scheme)

    async def get_scheme_by_id(
        self, db: AsyncSession, scheme_id: str
    ) -> Optional[SchemeDetail]:
        """Get full scheme detail by ID."""
        stmt = (
            select(Scheme)
            .where(Scheme.id == scheme_id)
            .options(
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.category),
            )
        )
        result = await db.execute(stmt)
        scheme = result.scalar_one_or_none()
        if not scheme:
            return None
        return self._to_detail(scheme)

    async def get_categories(self, db: AsyncSession) -> list[dict]:
        """Get all scheme categories."""
        from app.services.cache import cache
        cached_cats = await cache.get("scheme_categories")
        if cached_cats is not None:
            return cached_cats

        stmt = select(Category).order_by(Category.name)
        result = await db.execute(stmt)
        categories = result.scalars().all()
        data = [
            {
                "id": c.id,
                "slug": c.slug,
                "name": c.name,
                "name_hi": c.name_hi,
                "icon": c.icon,
                "color": c.color,
            }
            for c in categories
        ]
        await cache.set("scheme_categories", data, ttl_seconds=300.0)
        return data

    async def toggle_scheme_status(
        self, db: AsyncSession, scheme_id: str, is_active: bool
    ) -> bool:
        """
        Toggle scheme active/inactive status.
        Returns True if scheme was found and updated, False if not found.
        """
        stmt = select(Scheme).where(Scheme.id == scheme_id)
        result = await db.execute(stmt)
        scheme = result.scalar_one_or_none()
        if not scheme:
            return False
        scheme.is_active = is_active
        await db.commit()
        logger.info(f"Scheme {scheme_id} active status set to {is_active}")
        return True

    async def delete_scheme(self, db: AsyncSession, scheme_id: str) -> bool:
        """
        Permanently delete a scheme (and cascade eligibility rules via FK).
        Returns True if deleted, False if not found.
        """
        stmt = select(Scheme).where(Scheme.id == scheme_id)
        result = await db.execute(stmt)
        scheme = result.scalar_one_or_none()
        if not scheme:
            return False
        await db.delete(scheme)
        await db.commit()
        logger.info(f"Scheme {scheme_id} deleted permanently")
        return True

    def _to_card(self, scheme: Scheme) -> SchemeCard:
        return SchemeCard(
            id=scheme.id,
            name=scheme.name,
            name_hi=scheme.name_hi,
            slug=scheme.slug,
            ministry=scheme.ministry,
            level=scheme.level,
            state_code=scheme.state_code,
            benefits_amount=scheme.benefits_amount,
            scheme_type=scheme.scheme_type or [],
            tags=scheme.tags or [],
            category_name=scheme.category.name if scheme.category else None,
            category_icon=scheme.category.icon if scheme.category else None,
            is_active=scheme.is_active,
        )

    def _to_detail(self, scheme: Scheme) -> SchemeDetail:
        # Build eligibility rules summary for display
        rules_summary = []
        for rule in (scheme.eligibility_rules or []):
            if rule.description:
                rules_summary.append(rule.description)
            else:
                rules_summary.append(f"{rule.rule_type}: {rule.operator} {rule.value}")

        return SchemeDetail(
            id=scheme.id,
            name=scheme.name,
            name_hi=scheme.name_hi,
            slug=scheme.slug,
            ministry=scheme.ministry,
            level=scheme.level,
            state_code=scheme.state_code,
            benefits_amount=scheme.benefits_amount,
            scheme_type=scheme.scheme_type or [],
            tags=scheme.tags or [],
            category_name=scheme.category.name if scheme.category else None,
            category_icon=scheme.category.icon if scheme.category else None,
            is_active=scheme.is_active,
            description=scheme.description,
            description_hi=scheme.description_hi,
            benefits=scheme.benefits,
            benefits_hi=scheme.benefits_hi,
            required_documents=scheme.required_documents or [],
            application_process=scheme.application_process,
            application_process_hi=scheme.application_process_hi,
            application_url=scheme.application_url,
            official_website=scheme.official_website,
            helpline=scheme.helpline,
            deadline=str(scheme.deadline) if scheme.deadline else None,
            launched_date=str(scheme.launched_date) if scheme.launched_date else None,
            eligibility_rules_summary=rules_summary,
            status=getattr(scheme, "status", None),
            last_seen=getattr(scheme, "last_seen", None),
            last_checked=getattr(scheme, "last_checked", None),
            version=getattr(scheme, "version", None),
            source_url=getattr(scheme, "source_url", None),
            confidence_score=getattr(scheme, "confidence_score", None),
            updated_at=getattr(scheme, "updated_at", None),
        )


# Singleton
scheme_service = SchemeService()
