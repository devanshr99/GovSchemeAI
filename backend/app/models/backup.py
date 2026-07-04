import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class BackupJob(Base):
    """
    Schedules and configurations for automated database/file backups.
    """
    __tablename__ = "backup_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    backup_type = Column(String(50), nullable=False)  # 'daily', 'weekly', 'monthly', 'manual'
    is_active = Column(Boolean, default=True, nullable=False)
    storage_provider = Column(String(50), default="local", nullable=False)  # 'local', 's3', 'gcs', 'azure', 'b2'
    retention_days = Column(Integer, default=30, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    history = relationship("BackupHistory", back_populates="job", cascade="all, delete-orphan")


class BackupHistory(Base):
    """
    Logs of executed backup runs containing sizes, checksums, and storage targets.
    """
    __tablename__ = "backup_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("backup_jobs.id", ondelete="SET NULL"), nullable=True)
    backup_type = Column(String(50), nullable=False)
    status = Column(String(50), default="Pending", nullable=False)  # 'Completed', 'Failed', 'Corrupted'
    duration_seconds = Column(Float, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    backup_path = Column(String(500), nullable=True)
    checksum = Column(String(64), nullable=True)
    targets = Column(JSON, default=list, nullable=False)  # e.g., ['database', 'files', 'configs', 'logs', 'index']
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("BackupJob", back_populates="history")
    restores = relationship("RestoreHistory", back_populates="backup")


class RestoreHistory(Base):
    """
    Logs of database, index, or full filesystem restore events.
    """
    __tablename__ = "restore_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    backup_history_id = Column(String(36), ForeignKey("backup_history.id", ondelete="SET NULL"), nullable=True)
    target = Column(String(50), nullable=False)  # 'full', 'database', 'configs', 'index', 'files'
    status = Column(String(50), default="Pending", nullable=False)  # 'Completed', 'Failed'
    duration_seconds = Column(Float, nullable=True)
    error_message = Column(String(500), nullable=True)
    initiated_by = Column(String(100), nullable=False)  # user/system actor name
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    backup = relationship("BackupHistory", back_populates="restores")


class DisasterEvent(Base):
    """
    Records of infrastructure service outages, failures, and resolution updates.
    """
    __tablename__ = "disaster_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    target = Column(String(50), nullable=False)  # 'Database', 'Worker', 'Scheduler', 'Redis', 'Queue', 'Crawler', 'CloudVM'
    severity = Column(String(50), nullable=False)  # 'WARNING', 'CRITICAL'
    description = Column(String(500), nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(String(500), nullable=True)


class FailoverEvent(Base):
    """
    Records of health-check-triggered failovers from primary to replica backend engines.
    """
    __tablename__ = "failover_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_instance = Column(String(100), nullable=False)
    to_instance = Column(String(100), nullable=False)
    status = Column(String(50), default="Triggered", nullable=False)  # 'Triggered', 'Succeeded', 'Failed'
    triggered_by = Column(String(100), default="system", nullable=False)
    validated = Column(Boolean, default=False, nullable=False)
    recovery_time_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
