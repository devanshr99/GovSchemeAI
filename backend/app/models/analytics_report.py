import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AnalyticsReport(Base):
    """
    Stores generated metric snapshots and performance reports compiled for the admin.
    """
    __tablename__ = "analytics_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'custom'
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    summary_data = Column(JSON, default=dict, nullable=False)
