"""
Scheme Lifecycle and Status History ORM models.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class SchemeLifecycle(Base):
    __tablename__ = "scheme_lifecycles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    consecutive_missing_scans = Column(Integer, default=0, nullable=False)
    inactive_since = Column(DateTime, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_checked = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SchemeLifecycle scheme_id={self.scheme_id[:8]} missing_scans={self.consecutive_missing_scans}>"


class SchemeStatusHistory(Base):
    __tablename__ = "scheme_status_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    changed_by = Column(String(100), default="system", nullable=False)
    reason = Column(String(500), nullable=True)
    evidence_url = Column(String(1000), nullable=True)
    scan_id = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<SchemeStatusHistory scheme_id={self.scheme_id[:8]} status: {self.old_status} -> {self.new_status}>"
