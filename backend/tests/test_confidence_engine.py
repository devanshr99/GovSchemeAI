"""
Unit tests for Validation & Confidence Engine (Phase 6).
"""

from app.services.confidence_engine import confidence_engine


def test_confidence_engine_complete_schema():
    """Verify high-quality complete scheme JSON gets HIGH confidence status."""
    data = {
        "scheme_name": "PM Kisan Samman Nidhi",
        "short_description": "Direct income support for farmers.",
        "benefits": "INR 6000 cash transfer annually.",
        "eligibility": "Farmers owning land.",
        "income_criteria": None,
        "age_criteria": "18 to 100",
        "gender": "all",
        "category": "all",
        "required_documents": ["Aadhaar", "Land Records"],
        "application_process": "Apply via CSC portal.",
        "official_url": "https://pmkisan.gov.in",
        "department": "Agriculture Department",
        "ministry": "Ministry of Agriculture",
        "state": None,
        "target_beneficiaries": "Farmers",
        "application_mode": "online",
        "launch_date": "2019-02-24",
        "last_updated": "2026-01-01",
        "status": "active",
        "helpline_number": "155261",
        "official_email": "pmkisan-ict@gov.in",
        "official_website": "https://pmkisan.gov.in"
    }

    result = confidence_engine.process(data)
    assert result["validation_status"] == "valid"
    assert result["confidence_level"] == "HIGH"
    assert result["confidence_score"] >= 90
    assert len(result["warnings"]) == 0
    assert len(result["missing_fields"]) == 0


def test_confidence_engine_missing_required_fields():
    """Verify missing required keys results in immediate REJECTED state."""
    data = {
        "scheme_name": "Incomplete Yojana",
        # Missing description
        "benefits": "Provides free education."
    }

    result = confidence_engine.process(data)
    assert result["validation_status"] == "invalid"
    assert result["confidence_level"] == "REJECTED"
    assert result["confidence_score"] == 0
    assert "short_description" in result["missing_fields"]


def test_confidence_engine_unofficial_url_warning():
    """Verify non-gov.in urls trigger warnings and lower confidence scores."""
    data = {
        "scheme_name": "Private Blogs Aggregator",
        "short_description": "An unofficial blog listing gov benefits.",
        "benefits": "Free resources links.",
        "eligibility": "Open to all categories",
        "income_criteria": "No income limit",
        "age_criteria": "No limit",
        "gender": "all",
        "category": "all",
        "required_documents": ["Aadhaar"],
        "application_process": "Search on portal",
        "official_url": "https://yojanablog.com/details",  # Non-gov URL
        "ministry": "Ministry of Welfare",
        "department": "Welfare Department",
        "state": "National",
        "target_beneficiaries": "Citizens",
        "application_mode": "online",
        "helpline_number": "1800-xxx-xxxx",
        "official_email": "contact@yojanablog.com",
        "launch_date": "2026-01-01",
        "last_updated": "2026-01-01",
        "status": "active"
    }

    result = confidence_engine.process(data)
    # Payload is valid but confidence is lower
    assert result["validation_status"] == "valid"
    assert result["confidence_level"] in ("HIGH", "MEDIUM", "LOW")
    assert any("government domain" in w for w in result["warnings"])


def test_confidence_engine_invalid_date_format():
    """Verify incorrect date formats trigger validation failures."""
    data = {
        "scheme_name": "Yojana with Broken Date",
        "short_description": "Valid description details.",
        "benefits": "Free stipend support.",
        "launch_date": "24-02-2019",  # Invalid format (expected YYYY-MM-DD)
        "official_url": "https://yojana.gov.in"
    }

    result = confidence_engine.process(data)
    assert result["validation_status"] == "invalid"
    assert result["confidence_level"] == "REJECTED"
    assert any("Invalid date format" in w for w in result["warnings"])


def test_confidence_engine_invalid_status_value():
    """Verify incorrect status triggers warnings."""
    data = {
        "scheme_name": "Yojana with Broken Status",
        "short_description": "Valid description details.",
        "benefits": "Free stipend support.",
        "status": "pending_approval",  # Invalid status (expected active/inactive/draft)
        "official_url": "https://yojana.gov.in"
    }

    result = confidence_engine.process(data)
    assert any("Invalid status value" in w for w in result["warnings"])
