"""
Unit tests for Scheme Updates normalizer, deduplication, and model integration.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.scrapers.base import RawSchemeData
from app.scrapers.normalizer import SchemaNormalizer
from app.scrapers.dedup import DeduplicationEngine


def test_normalizer_slug_generation():
    """Verify that SchemaNormalizer generates clean alphanumeric slug strings."""
    normalizer = SchemaNormalizer()
    assert normalizer.generate_slug("Pradhan Mantri Awas Yojana") == "pradhan-mantri-awas-yojana"
    assert normalizer.generate_slug("PM-KISAN: Support scheme!") == "pm-kisan-support-scheme"
    assert normalizer.generate_slug("Scholarship for ST Students 2026") == "scholarship-for-st-students-2026"


def test_normalizer_category_mapping():
    """Verify category hints are parsed correctly into valid category slugs."""
    normalizer = SchemaNormalizer()
    normalizer.category_cache = {
        "agriculture": 1,
        "health": 2,
        "education": 3,
    }

    assert normalizer.map_category("Farming support programs") == 1
    assert normalizer.map_category("Hospital medical treatments") == 2
    assert normalizer.map_category("Scholarship college stipend") == 3
    assert normalizer.map_category("Unknown category keyword") is None


def test_dedup_fuzzy_matching():
    """Verify DeduplicationEngine fuzzy matches similar names and slugs."""
    dedup = DeduplicationEngine(fuzzy_threshold=85)
    dedup.schemes_cache = [
        {"id": "1", "name": "PM-KISAN Samman Nidhi", "slug": "pm-kisan-samman-nidhi"},
        {"id": "2", "name": "Ayushman Bharat National Health Protection", "slug": "ayushman-bharat"}
    ]

    # Exact slug match
    matched_id, confidence = dedup.find_match("PM Kisan", "pm-kisan-samman-nidhi")
    assert matched_id == "1"
    assert confidence == 1.0

    # Fuzzy name match
    matched_id, confidence = dedup.find_match("Ayushman Bharat National Health Protection Program", "ayushman-bharat-new")
    assert matched_id == "2"
    assert confidence >= 0.85
