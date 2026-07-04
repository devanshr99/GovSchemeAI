import pytest
import logging
import json
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings
from app.utils.observability import trace_id_var, request_id_var, job_id_var, user_id_var
from app.utils.logging import JSONFormatter

client = TestClient(app)
settings = get_settings()
ADMIN_TOKEN = settings.jwt_secret or "govscheme-ai-dev-secret-change-in-prod"

def test_health_endpoints():
    """Verify that root /health, /ready, and /live work and evaluate target systems."""
    for path in ["/health", "/ready", "/live"]:
        response = client.get(path)
        # It might be 200 or 503 depending on whether all 7 components are up/mocked
        assert response.status_code in (200, 503)
        data = response.json()
        if "detail" in data:
            data = data["detail"]
        assert "status" in data
        assert "details" in data
        details = data["details"]
        assert "database" in details
        assert "redis" in details
        assert "queue" in details
        assert "queue_workers" in details
        assert "scheduler" in details
        assert "crawler" in details
        assert "ai_service" in details

def test_metrics_endpoint_protection():
    """Verify metrics route is protected against unauthorized requests and accessible to admins."""
    # Unauthorized
    resp = client.get("/metrics")
    assert resp.status_code == 401

    # Authorized
    resp_auth = client.get(f"/metrics?token={ADMIN_TOKEN}")
    assert resp_auth.status_code == 200
    assert "text/plain" in resp_auth.headers["content-type"]
    assert "govscheme_system_cpu_usage_percent" in resp_auth.text

def test_tracing_context_propagation():
    """Verify that tracing headers are generated, processed, and returned."""
    trace_id = "test-custom-trace-id-12345"
    req_id = "test-custom-request-id-67890"

    response = client.get(
        "/",
        headers={"x-trace-id": trace_id, "x-request-id": req_id}
    )
    assert response.status_code == 200
    assert response.headers.get("x-trace-id") == trace_id
    assert response.headers.get("x-request-id") == req_id

def test_structured_logging_formatter():
    """Verify that JSON log formatter extracts trace_id, request_id, job_id, etc. from contextvars."""
    # Set context variables manually
    t_token = trace_id_var.set("log-trace-123")
    r_token = request_id_var.set("log-req-456")
    j_token = job_id_var.set("log-job-789")
    u_token = user_id_var.set("log-user-abc")

    try:
        formatter = JSONFormatter()
        record = logging.LogRecord(
            name="govscheme.test.log",
            level=logging.WARNING,
            pathname="test_file.py",
            lineno=10,
            msg="Observability verification test message",
            args=(),
            exc_info=None
        )
        log_json_str = formatter.format(record)
        log_data = json.loads(log_json_str)

        assert log_data["severity"] == "WARNING"
        assert log_data["service"] == "govscheme.test.log"
        assert log_data["trace_id"] == "log-trace-123"
        assert log_data["request_id"] == "log-req-456"
        assert log_data["job_id"] == "log-job-789"
        assert log_data["user_id"] == "log-user-abc"
        assert log_data["message"] == "Observability verification test message"
    finally:
        # Cleanup
        trace_id_var.reset(t_token)
        request_id_var.reset(r_token)
        job_id_var.reset(j_token)
        user_id_var.reset(u_token)

def test_alert_rules_evaluation():
    """Verify alert check logic operates on metric variables correctly."""
    from app.utils.observability import telemetry_collector
    # Stub alert trigger checks
    checked = []
    
    async def mock_publish_event(db, event_type, severity, title, message):
        checked.append(event_type)

    # Backup the original publish_event function
    from app.services.notification_engine import notification_engine
    original_publish = notification_engine.publish_event
    notification_engine.publish_event = mock_publish_event

    try:
        import asyncio
        loop = asyncio.new_event_loop()
        # Evaluate warning levels: cpu=95%, mem=95%, disk=95%, workers=0, queued=100
        loop.run_until_complete(
            telemetry_collector._evaluate_alert_rules(
                q_pending=100,
                online_workers_count=0,
                cpu_val=95.0,
                mem_val=95.0,
                disk_val=95.0
            )
        )
        loop.close()

        # Check triggered alerts
        assert "low_disk_space" in checked
        assert "high_cpu" in checked
        assert "high_memory" in checked
        assert "worker_offline" in checked
        assert "queue_overflow" in checked
    finally:
        notification_engine.publish_event = original_publish
