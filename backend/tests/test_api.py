import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response_live = client.get("/api/health/live")
    assert response_live.status_code == 200
    assert response_live.json()["status"] == "healthy"

    response_ready = client.get("/api/health/ready")
    assert response_ready.status_code == 200
    assert response_ready.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "app" in response.json()
