from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.routers.dashboard import verify_admin
from app.services.analytics_engine import analytics_engine
from app.models.analytics_report import AnalyticsReport
from app.utils.exporter import export_to_csv, export_to_excel, export_to_pdf

router = APIRouter(prefix="/api/admin/analytics", tags=["Analytics & Reporting"])


@router.get("/summary", dependencies=[Depends(verify_admin)])
async def get_summary_analytics(db: AsyncSession = Depends(get_db)):
    """Get high-level summary overview metrics."""
    return await analytics_engine.get_summary(db)


@router.get("/crawler", dependencies=[Depends(verify_admin)])
async def get_crawler_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get crawler metrics for past N days."""
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()
    return await analytics_engine.get_crawler_metrics(db, start, end)


@router.get("/ai", dependencies=[Depends(verify_admin)])
async def get_ai_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get AI validation and extraction metrics for past N days."""
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()
    return await analytics_engine.get_ai_metrics(db, start, end)


@router.get("/search", dependencies=[Depends(verify_admin)])
async def get_search_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get search history and latencies metrics for past N days."""
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()
    return await analytics_engine.get_search_metrics(db, start, end)


@router.get("/scheduler", dependencies=[Depends(verify_admin)])
async def get_scheduler_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get scheduler runs and queue load metrics for past N days."""
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()
    return await analytics_engine.get_scheduler_queue_metrics(db, start, end)


@router.get("/notifications", dependencies=[Depends(verify_admin)])
async def get_notification_analytics(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get alerts and notification delivery metrics for past N days."""
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()
    return await analytics_engine.get_notification_metrics(db, start, end)


@router.get("/reports", dependencies=[Depends(verify_admin)])
async def list_reports(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List compiled archived metrics reports."""
    stmt = select(AnalyticsReport).order_by(desc(AnalyticsReport.created_at)).limit(limit)
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [
        {
            "id": r.id,
            "report_type": r.report_type,
            "start_date": r.start_date.isoformat(),
            "end_date": r.end_date.isoformat(),
            "created_at": r.created_at.isoformat()
        } for r in reports
    ]


@router.post("/reports/generate", dependencies=[Depends(verify_admin)])
async def generate_report(
    report_type: str = Query(..., regex="^(daily|weekly|monthly|custom)$"),
    start_days_ago: int = Query(7, ge=1, le=365, description="Report timeline range days start"),
    db: AsyncSession = Depends(get_db)
):
    """Compile and archive a system performance report snapshot."""
    start = datetime.utcnow() - timedelta(days=start_days_ago)
    end = datetime.utcnow()
    report = await analytics_engine.compile_and_save_report(db, report_type, start, end)
    return {
        "status": "success",
        "report_id": report.id,
        "created_at": report.created_at.isoformat()
    }


@router.get("/reports/{report_id}/export", dependencies=[Depends(verify_admin)])
async def export_report(
    report_id: str,
    format: str = Query(..., regex="^(csv|excel|pdf)$"),
    db: AsyncSession = Depends(get_db)
):
    """Export a compiled snapshot report into CSV, Excel, or PDF format."""
    report = await db.get(AnalyticsReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report snapshot not found.")

    data = report.summary_data
    filename = f"yojana_metrics_report_{report_id[:8]}"

    if format == "csv":
        csv_str = export_to_csv(data)
        return Response(
            content=csv_str,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    elif format == "excel":
        excel_str = export_to_excel(data)
        return Response(
            content=excel_str,
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": f"attachment; filename={filename}.xls"}
        )
    else:
        # pdf format
        pdf_bytes = export_to_pdf(f"GovSchemeAI Admin Metrics Report ({report.report_type.upper()})", data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"}
        )
