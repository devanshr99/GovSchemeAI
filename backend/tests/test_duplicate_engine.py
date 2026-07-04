"""
Unit tests for Duplicate Detection & Canonicalization Engine (Phase 7).
"""

from app.services.duplicate_engine import duplicate_engine


def test_similarity_agent_exact_match():
    """Verify that exact field matching yields a score of 100."""
    new_scheme = {
        "scheme_name": "PM Vishwakarma",
        "official_url": "https://vishwakarma.gov.in",
        "benefits": "Stipend of INR 500 per day.",
        "eligibility": "Artisans and craftspeople.",
        "ministry": "Ministry of MSME",
        "department": "Department of MSME"
    }

    existing_scheme = {
        "scheme_name": "PM Vishwakarma",
        "official_url": "https://vishwakarma.gov.in",
        "benefits": "Stipend of INR 500 per day.",
        "eligibility": "Artisans and craftspeople.",
        "ministry": "Ministry of MSME",
        "department": "Department of MSME"
    }

    score, fields = duplicate_engine.run_similarity_agent(new_scheme, existing_scheme)
    assert score == 100.0
    assert "scheme_name" in fields
    assert "official_url" in fields
    assert "benefits" in fields
    assert "eligibility" in fields
    assert "ministry" in fields
    assert "department" in fields


def test_similarity_agent_fuzzy_match():
    """Verify fuzzy matching calculations handle text variations correctly."""
    new_scheme = {
        "scheme_name": "PM Vishwakarma Scheme",
        "official_url": "https://vishwakarma.gov.in/home",
        "benefits": "Daily stipend of INR 500.",
        "eligibility": "Artisans.",
        "ministry": "Ministry of MSME"
    }

    existing_scheme = {
        "scheme_name": "Pradhan Mantri Vishwakarma",
        "official_url": "https://vishwakarma.gov.in",
        "benefits": "INR 500 daily stipend.",
        "eligibility": "Artisans and craftspeople.",
        "ministry": "Ministry of Micro, Small and Medium Enterprises"
    }

    score, fields = duplicate_engine.run_similarity_agent(new_scheme, existing_scheme)
    # Score should be high (>50) but less than 100
    assert 50.0 < score < 100.0


def test_canonicalization_longest_name():
    """Verify longer formal names are selected as canonical names."""
    # PM Vishwakarma vs Pradhan Mantri Vishwakarma
    name_a = "PM Vishwakarma"
    name_b = "Pradhan Mantri Vishwakarma"

    canonical, aliases = duplicate_engine.run_canonicalization_agent(name_a, name_b)
    assert canonical == "Pradhan Mantri Vishwakarma"
    assert "PM Vishwakarma" in aliases


def test_conflict_detection():
    """Verify mismatched key content fields trigger conflict warnings."""
    new_scheme = {
        "benefits": "Free training + INR 1000 stipend.",
        "official_url": "https://vishwakarma-new.gov.in",
        "department": "MSME Dept"
    }

    existing_scheme = {
        "benefits": "INR 500 stipend only.",
        "official_url": "https://vishwakarma.gov.in",
        "department": "Department of Artisans"
    }

    conflicts = duplicate_engine.run_conflict_agent(new_scheme, existing_scheme)
    assert "benefits" in conflicts
    assert "official_url" in conflicts
    assert "department" in conflicts

    assert conflicts["benefits"]["new"] == "Free training + INR 1000 stipend."
    assert conflicts["benefits"]["existing"] == "INR 500 stipend only."


def test_duplicate_recommendation_thresholds():
    """Verify pipeline recommends correct actions based on similarity scores."""
    existing_list = [
        {
            "id": "1",
            "name": "PM Vishwakarma",
            "slug": "pm-vishwakarma",
            "official_url": "https://vishwakarma.gov.in",
            "benefits": "INR 500 stipend.",
            "eligibility": "Artisans."
        }
    ]

    # 1. Clear Duplicate
    new_dup = {
        "scheme_name": "PM Vishwakarma",
        "official_url": "https://vishwakarma.gov.in",
        "benefits": "INR 500 stipend.",
        "eligibility": "Artisans."
    }
    res_dup = duplicate_engine.process_duplicate_check(existing_list, new_dup)
    assert res_dup["recommendation"] == "duplicate"
    assert len(res_dup["duplicate_candidates"]) == 1

    # 2. Review Required (due to conflicting benefits)
    new_conflict = {
        "scheme_name": "PM Vishwakarma",
        "official_url": "https://vishwakarma.gov.in",
        "benefits": "Free Laptop + INR 5000 stipend.",  # Conflict!
        "eligibility": "Artisans."
    }
    res_conflict = duplicate_engine.process_duplicate_check(existing_list, new_conflict)
    assert res_conflict["recommendation"] == "review_required"
    assert "benefits" in res_conflict["conflict_report"]

    # 3. Unique Scheme
    new_unique = {
        "scheme_name": "Ayushman Bharat National Health Protection",
        "official_url": "https://pmjay.gov.in",
        "benefits": "Health cover up to 5 lakh.",
        "eligibility": "Poor families."
    }
    res_unique = duplicate_engine.process_duplicate_check(existing_list, new_unique)
    assert res_unique["recommendation"] == "unique"
    assert len(res_unique["duplicate_candidates"]) == 0
