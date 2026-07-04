"""
Deduplication Engine
Checks scraped and normalized schemes against the existing database
to determine if they are new, updates to existing schemes, or exact duplicates.
Uses exact slug matching and fuzzy string matching on names.
"""

import logging
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from thefuzz import fuzz

from app.models.scheme import Scheme

logger = logging.getLogger("yojana.scrapers.dedup")


class DeduplicationEngine:
    """
    Identifies if a scheme already exists using:
    1. Exact slug match.
    2. Fuzzy string matching on names (threshold > 85%).
    3. Content comparison to determine if updates exist.
    """

    def __init__(self, fuzzy_threshold: int = 85):
        self.fuzzy_threshold = fuzzy_threshold
        # Cache existing schemes in memory for speed during bulk updates
        self.schemes_cache: list[dict] = []

    async def load_existing_schemes(self, db: AsyncSession):
        """Pre-load existing schemes into memory."""
        if not self.schemes_cache:
            stmt = select(Scheme.id, Scheme.name, Scheme.slug, Scheme.description, Scheme.benefits_amount)
            res = await db.execute(stmt)
            for row in res.all():
                self.schemes_cache.append({
                    "id": row.id,
                    "name": row.name,
                    "slug": row.slug,
                    "description": row.description or "",
                    "benefits_amount": row.benefits_amount or "",
                })
            logger.info(f"Deduplication Engine: Loaded {len(self.schemes_cache)} schemes into cache")

    def find_match(self, normalized_name: str, normalized_slug: str) -> Tuple[Optional[str], float]:
        """
        Search for a matching existing scheme in the cache.
        Returns: Tuple[matched_scheme_id, confidence_score]
        """
        # 1. Look for exact slug match
        for item in self.schemes_cache:
            if item["slug"] == normalized_slug:
                return item["id"], 1.0

        # 2. Look for fuzzy name match
        best_match_id = None
        best_score = 0.0

        for item in self.schemes_cache:
            # Fuzzy match ratio (Levenshtein distance)
            score = fuzz.token_sort_ratio(normalized_name.lower(), item["name"].lower())
            if score > best_score:
                best_score = score
                best_match_id = item["id"]

        # Convert 0-100 score to 0.0-1.0 confidence
        confidence = best_score / 100.0
        if best_score >= self.fuzzy_threshold:
            return best_match_id, confidence

        return None, 0.0

    def has_content_changed(self, normalized_data: dict, existing_scheme: dict) -> bool:
        """
        Check if normalized fields differ significantly from database fields.
        Avoids triggering update reviews for identical data.
        """
        # Key fields to detect updates
        desc_changed = normalized_data.get("description", "").strip() != existing_scheme.get("description", "").strip()
        benefits_changed = normalized_data.get("benefits_amount", "").strip() != existing_scheme.get("benefits_amount", "").strip()

        return desc_changed or benefits_changed

    async def classify(
        self, db: AsyncSession, normalized_scheme: dict
    ) -> Tuple[str, Optional[str], float]:
        """
        Classifies a normalized scheme:
        Returns: Tuple[match_type ('new'/'update'/'duplicate'), matched_id, confidence]
        """
        await self.load_existing_schemes(db)

        name = normalized_scheme["name"]
        slug = normalized_scheme["slug"]

        matched_id, confidence = self.find_match(name, slug)

        if not matched_id:
            return "new", None, 0.0

        # Retrieve full existing scheme item from memory/db to see if it changed
        existing = next((s for s in self.schemes_cache if s["id"] == matched_id), None)
        if existing and self.has_content_changed(normalized_scheme, existing):
            return "update", matched_id, confidence

        # It's in the DB but no content changes detected
        return "duplicate", matched_id, confidence
