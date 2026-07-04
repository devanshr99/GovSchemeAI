"""
Sync Audit Logs ORM model.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class SyncAuditLog(Base):
    __tablename__ = "sync_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    operation = Column(String(50), nullable=False, index=True)  # e.g., 'INSERT', 'UPDATE', 'DEACTIVATE', 'FAILURE', 'ROLLBACK'
    scheme_id = Column(String(36), nullable=True)
    previous_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    user_system = Column(String(50), default="system", nullable=False)
    details = Column(Text, nullable=True)

    def __repr__(self):
        return f"<SyncAuditLog {self.operation} on {self.scheme_id} at {self.timestamp}>"
