import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings
from app.database import get_db, init_db
from app.models.analytics_report import AnalyticsReport

client = TestClient(app)
settings = get_settings()
ADMIN_TOKEN = settings.jwt_secret or "govscheme-ai-dev-secret-change-in-prod"


def test_analytics_authorization_gates():
    """Verify unauthorized requests without proper admin tokens return 401."""
    # Summary API unauthorized
    resp = client.get("/api/admin/analytics/summary")
    assert resp.status_code == 401

    # Generate Report unauthorized
    resp = client.post("/api/admin/analytics/reports/generate?report_type=daily")
    assert resp.status_code == 401


def test_analytics_summary_retrieval():
    """Verify summary stats endpoint returns aggregated layout successfully."""
    resp = client.get(f"/api/admin/analytics/summary?token={ADMIN_TOKEN}")
    assert resp.status_code == 200
    data = resp.json()

    assert "schemes" in data
    assert "sources" in data
    assert "crawler" in data
    assert "search" in data
    assert "alerts" in data


@pytest.mark.asyncio
async def test_report_generation_and_export():
    """Verify compiling metrics snapshots and downloading CSV/Excel/PDF exports operates successfully."""
    await init_db()

    # 1. Generate new daily report
    resp = client.post(f"/api/admin/analytics/reports/generate?report_type=daily&token={ADMIN_TOKEN}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "report_id" in data
    report_id = data["report_id"]

    # 2. Export to CSV
    resp_csv = client.get(f"/api/admin/analytics/reports/{report_id}/export?format=csv&token={ADMIN_TOKEN}")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers["content-type"]
    assert "Metric Category,Metric Name,Value" in resp_csv.text

    # 3. Export to Excel
    resp_xls = client.get(f"/api/admin/analytics/reports/{report_id}/export?format=excel&token={ADMIN_TOKEN}")
    assert resp_xls.status_code == 200
    assert "application/vnd.ms-excel" in resp_xls.headers["content-type"]
    assert "Metric Category\tMetric Name\tValue" in resp_xls.text

    # 4. Export to PDF
    resp_pdf = client.get(f"/api/admin/analytics/reports/{report_id}/export?format=pdf&token={ADMIN_TOKEN}")
    assert resp_pdf.status_code == 200
    assert "application/pdf" in resp_pdf.headers["content-type"]
    # Check PDF Magic Number
    assert resp_pdf.content.startswith(b"%PDF-1.4")

    # Cleanup report from db
    async for db in get_db():
        report_record = await db.get(AnalyticsReport, report_id)
        if report_record:
            await db.delete(report_record)
            await db.commit()
        break
