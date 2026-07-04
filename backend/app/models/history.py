"""
Version History & Audit ORM models.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, ForeignKey
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class SchemeVersion(Base):
    __tablename__ = "scheme_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(100), default="system", nullable=False)
    change_reason = Column(String(500), nullable=True)
    change_type = Column(String(50), nullable=False)  # 'INSERT', 'UPDATE', 'ROLLBACK', 'DEACTIVATE'
    previous_version = Column(Integer, nullable=True)
    source_url = Column(String(1000), nullable=True)
    scan_id = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    scheme_data = Column(JSON, nullable=False)  # Full state of all mutable columns

    def __repr__(self):
        return f"<SchemeVersion scheme_id={self.scheme_id[:8]} ver={self.version_number}>"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    operation = Column(String(100), nullable=False, index=True)  # e.g., 'Scheme Created', 'Scheme Updated'
    scheme_id = Column(String(36), nullable=True, index=True)
    version_number = Column(Integer, nullable=True)
    actor = Column(String(100), default="system", nullable=False)
    source = Column(String(100), nullable=True)
    status = Column(String(50), default="success", nullable=False)
    details = Column(String(1000), nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.operation} by {self.actor} at {self.timestamp}>"


class FieldHistory(Base):
    __tablename__ = "field_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scheme_id = Column(String(36), nullable=False, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    version_number = Column(Integer, nullable=False)
    modified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    modified_by = Column(String(100), default="system", nullable=False)

    def __repr__(self):
        return f"<FieldHistory {self.field_name} version={self.version_number}>"
