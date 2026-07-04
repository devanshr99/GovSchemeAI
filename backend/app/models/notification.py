import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Notification(Base):
    """
    Represents generated system alerts and notifications.
    """
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), index=True, nullable=False)  # 'new_scheme', 'sync_failed', etc.
    severity = Column(String(50), nullable=False)  # INFO, SUCCESS, WARNING, ERROR, CRITICAL
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    details = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    logs = relationship("NotificationLog", back_populates="notification", cascade="all, delete-orphan")


class NotificationLog(Base):
    """
    Logs delivery status and details across various channels for notifications.
    """
    __tablename__ = "notification_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    notification_id = Column(String(36), ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(50), nullable=False)  # 'in_app', 'email', 'slack', etc.
    status = Column(String(50), default="pending", nullable=False)  # 'delivered', 'failed', 'retrying'
    delivered_at = Column(DateTime, nullable=True)
    error_message = Column(String(1000), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)

    notification = relationship("Notification", back_populates="logs")
