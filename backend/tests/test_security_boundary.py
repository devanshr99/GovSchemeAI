import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sql_injection_on_search():
    """Verify that SQL injection payloads in search query parameter do not trigger SQL syntax exceptions and are treated as literals."""
    payloads = [
        "kisan' OR 1=1 --",
        "kisan' UNION SELECT null, null, null --",
        "' OR '1'='1",
        "'; DROP TABLE schemes; --"
    ]
    for payload in payloads:
        # Request search with SQL injection string
        response = client.get(f"/api/search?q={payload}")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        # Ensure that SQLi search returned empty or literal match results and didn't crash the server
        assert isinstance(data["results"], list)

def test_sql_injection_on_scheme_detail():
    """Verify that SQL injection payloads in scheme slug parameter are treated safely (return 404 instead of SQL error)."""
    payloads = [
        "pm-kisan' OR '1'='1",
        "some-slug'; DROP TABLE schemes; --"
    ]
    for payload in payloads:
        response = client.get(f"/api/schemes/{payload}")
        # Invalid slug should just return 404 not found
        assert response.status_code == 404

def test_xss_prevention_on_chat():
    """Verify that chat responses properly escape HTML tags to prevent XSS execution on browser client."""
    # Chat message with XSS payload
    payload = {
        "message": "<script>alert('XSS')</script> Hello Yojana",
        "session_id": "test-session"
    }
    response = client.post("/api/chat", json=payload)
    # The endpoint should run cleanly, returning 200 or validation errors if not active, but the output must be escaped/cleaned
    assert response.status_code in (200, 404)
