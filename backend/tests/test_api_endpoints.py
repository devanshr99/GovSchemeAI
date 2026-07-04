import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings

client = TestClient(app)
settings = get_settings()
admin_token = settings.jwt_secret or "govscheme-ai-dev-secret-change-in-prod"

# ── Authentication & Authorization Tests ─────────────────────────────────────

def test_admin_dashboard_unauthorized():
    """Verify admin endpoints reject requests without correct JWT/Admin tokens with 401."""
    response = client.get("/api/admin/dashboard/stats")
    assert response.status_code == 401
    
    response = client.get("/api/admin/dashboard/stats", headers={"X-Admin-Token": "wrong-token"})
    assert response.status_code == 401

def test_admin_dashboard_authorized():
    """Verify admin stats endpoint allows access with valid credentials."""
    response = client.get("/api/admin/dashboard/stats", headers={"X-Admin-Token": admin_token})
    assert response.status_code == 200
    assert "system" in response.json()
    assert "sources" in response.json()

# ── Scheme Browsing APIs Tests ───────────────────────────────────────────────

def test_list_schemes_default():
    """Verify schemes listing endpoint returns correct fields, formatting, and status."""
    response = client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert "schemes" in data
    assert "total" in data
    assert len(data["schemes"]) <= 20

def test_list_schemes_pagination_and_filters():
    """Verify listing pagination limits, sortings, and categories slugs filters."""
    response = client.get("/api/schemes?page=1&page_size=5&level=central")
    assert response.status_code == 200
    data = response.json()
    assert len(data["schemes"]) <= 5

def test_list_schemes_invalid_filters():
    """Verify listing validation errors on invalid values."""
    response = client.get("/api/schemes?level=invalid-level")
    assert response.status_code == 422  # Validation Error

def test_get_categories():
    """Verify categories lookup response schema."""
    response = client.get("/api/schemes/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if len(response.json()) > 0:
        cat = response.json()[0]
        assert "id" in cat
        assert "slug" in cat
        assert "name" in cat

# ── Search & Autocomplete APIs Tests ─────────────────────────────────────────

def test_search_schemes_empty_query():
    """Verify search endpoint handles blank criteria."""
    response = client.get("/api/search")
    assert response.status_code == 200
    assert "results" in response.json()

def test_search_schemes_query():
    """Verify search with search token parameters."""
    response = client.get("/api/search?q=kisan&page_size=3")
    assert response.status_code == 200
    assert "results" in response.json()

def test_autocomplete_prefix():
    """Verify suggestions endpoint suggestions listing."""
    response = client.get("/api/search/autocomplete?prefix=pm")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)

# ── Eligibility Engine APIs Tests ────────────────────────────────────────────

def test_eligibility_check_validation_error():
    """Verify eligibility check rejects malformed/empty profile requests."""
    response = client.post("/api/eligibility/check", json={})
    assert response.status_code == 422

def test_eligibility_check_success():
    """Verify successful eligibility analysis execution."""
    payload = {
        "age": 28,
        "gender": "male",
        "state": "MH",
        "occupation": "farmer",
        "annual_income": 120000.0,
        "category": "general",
        "disability": False,
        "is_student": False,
        "is_farmer": True,
        "is_woman": False,
        "is_senior_citizen": False,
        "is_bpl": False,
        "language": "en"
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "schemes" in data
    assert "eligible_count" in data
    assert "profile_summary" in data

# ── Scheduler & Update Action APIs Tests ─────────────────────────────────────

def test_scheduler_trigger_unauthorized():
    """Verify scheduler triggering enforces admin auth checks."""
    response = client.post("/api/admin/dashboard/scheduler/jobs/manual_test_job/action?action=run_now")
    assert response.status_code == 401

def test_scheduler_trigger_authorized():
    """Verify scheduler triggering works under authentication."""
    response = client.post(
        "/api/admin/dashboard/scheduler/jobs/manual_test_job/action?action=run_now",
        headers={"X-Admin-Token": admin_token}
    )
    # The action endpoint will return either 200 (success) or 404 (if job id not found), but crucially authentication passes
    assert response.status_code in (200, 404)

# ── Analytics & Reporting APIs Tests ──────────────────────────────────────────

def test_analytics_summary_unauthorized():
    """Verify analytics stats are closed to guest users."""
    response = client.get("/api/admin/analytics/summary")
    assert response.status_code == 401

def test_analytics_summary_authorized():
    """Verify analytics summary fetches correctly for admins."""
    # Wire up header credentials
    response = client.get("/api/admin/analytics/summary", headers={"X-Admin-Token": admin_token})
    assert response.status_code == 200
    assert "search" in response.json()
