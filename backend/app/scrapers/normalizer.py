"""
Scheme Normalizer
Normalizes RawSchemeData into dictionary formats aligned with the live Scheme ORM models.
Ensures correct types, creates slugs, maps categories, and standardizes state codes.
"""

import re
import unicodedata
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.scheme import Category
from app.models.location import State
from app.scrapers.base import RawSchemeData


class SchemaNormalizer:
    """
    Standardizes raw scheme data fields, mapping categories and state codes,
    and formats JSON structures to prevent schema mismatches.
    """

    def __init__(self):
        self.category_cache: dict[str, int] = {}  # slug -> id
        self.state_cache: dict[str, str] = {}    # name/code -> code

    async def init_caches(self, db: AsyncSession):
        """Pre-load categories and states to speed up normalization lookups."""
        if not self.category_cache:
            cat_stmt = select(Category)
            cat_res = await db.execute(cat_stmt)
            for cat in cat_res.scalars().all():
                self.category_cache[cat.slug.lower()] = cat.id

        if not self.state_cache:
            state_stmt = select(State)
            state_res = await db.execute(state_stmt)
            for state in state_res.scalars().all():
                self.state_cache[state.name.lower()] = state.code
                self.state_cache[state.code.lower()] = state.code

    def generate_slug(self, name: str) -> str:
        """Slugify a scheme name safely (alphanumeric and dashes only)."""
        # Normalize unicode characters
        name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
        name = name.lower()
        # Replace non-alphanumeric characters with dashes
        name = re.sub(r'[^a-z0-9\s-]', '', name)
        name = re.sub(r'[\s-]+', '-', name).strip('-')
        return name

    def map_category(self, hint: str) -> Optional[int]:
        """
        Map category hint string to existing Category ID.
        Uses keywords matching categories like agriculture, health, education.
        """
        if not hint:
            return None
        hint = hint.lower()

        # Keyword mapping to category slugs
        mappings = {
            "agriculture": ["farmer", "agri", "farming", "crop", "fertilizer", "soil", "pm-kisan", "irrigation", "horticulture", "livestock"],
            "health": ["medical", "health", "hospital", "doctor", "treatment", "medicine", "ayushman", "disease", "vaccin"],
            "education": ["student", "school", "scholarship", "college", "fellowship", "education", "academy", "training", "university"],
            "housing": ["house", "housing", "awas", "home", "building", "residential", "slum"],
            "women": ["woman", "women", "girl", "child", "pregnancy", "maternal", "widow", "daughter"],
            "employment": ["job", "employ", "skill", "career", "work", "unemployed", "mgnrega", "livelihood"],
            "pension": ["pension", "insurance", "provident", "retirement", "senior", "bima", "lic", "suraksha"],
            "financial": ["bank", "loan", "subsidy", "financial", "credit", "jan-dhan", "saving", "investment", "interest"],
            "social": ["welfare", "disabled", "bpl", "social", "poor", "community", "caste", "tribe", "sc/st", "minority"]
        }

        for cat_slug, keywords in mappings.items():
            if cat_slug in hint:
                return self.category_cache.get(cat_slug)
            for keyword in keywords:
                if keyword in hint:
                    return self.category_cache.get(cat_slug)

        return None

    def normalize_state(self, state_str: str) -> Optional[str]:
        """Resolve state name or code to matching ISO State Code."""
        if not state_str:
            return None
        state_str = state_str.strip().lower()
        return self.state_cache.get(state_str)

    async def normalize(self, db: AsyncSession, raw: RawSchemeData) -> dict:
        """
        Converts RawSchemeData into standard Scheme model parameters dictionary.
        """
        await self.init_caches(db)

        # Basic fields
        normalized = {
            "name": raw.name.strip(),
            "name_hi": raw.name_hi.strip() if raw.name_hi else None,
            "slug": self.generate_slug(raw.name),
            "ministry": raw.ministry.strip() if raw.ministry else None,
            "department": raw.department.strip() if raw.department else None,
            "level": raw.level.lower() if raw.level else "central",
            "state_code": self.normalize_state(raw.state),
            "description": raw.description.strip() if raw.description else None,
            "description_hi": raw.description_hi.strip() if raw.description_hi else None,
            "benefits": raw.benefits.strip() if raw.benefits else None,
            "benefits_hi": raw.benefits_hi.strip() if raw.benefits_hi else None,
            "benefits_amount": raw.benefits_amount.strip() if raw.benefits_amount else None,
            "required_documents": [d.strip() for d in raw.required_documents if d.strip()],
            "application_process": raw.application_process.strip() if raw.application_process else None,
            "application_url": raw.application_url.strip() if raw.application_url else None,
            "official_website": raw.official_website.strip() if raw.official_website else None,
            "helpline": raw.helpline.strip() if raw.helpline else None,
            "is_active": True,
            "scheme_type": [t.lower() for t in raw.scheme_type] if raw.scheme_type else ["central"],
            "tags": [t.lower() for t in raw.tags] if raw.tags else [],
        }

        # Handle level validation
        if normalized["level"] not in ("central", "state", "district"):
            normalized["level"] = "central"

        # Determine category relation ID
        category_id = self.map_category(raw.category_hint)
        if not category_id and raw.tags:
            for tag in raw.tags:
                category_id = self.map_category(tag)
                if category_id:
                    break
        if not category_id and raw.ministry:
            category_id = self.map_category(raw.ministry)

        normalized["category_id"] = category_id

        return normalized
