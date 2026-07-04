import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class SchedulerJob(Base):
    """
    Represents background jobs registered in the scheduler system.
    """
    __tablename__ = "scheduler_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, index=True, nullable=False)
    job_type = Column(String(50), nullable=False)  # 'recurring', 'one_time', 'delayed'
    cron_expression = Column(String(100), nullable=True)
    next_run_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # 'active', 'paused', 'completed'
    max_retries = Column(Integer, default=3, nullable=False)
    retry_delay = Column(Integer, default=10, nullable=False)  # delay in seconds between retries
    timeout_seconds = Column(Integer, default=300, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    executions = relationship("JobExecutionHistory", back_populates="job", cascade="all, delete-orphan")


class JobExecutionHistory(Base):
    """
    Represents historical execution runs of scheduler jobs.
    """
    __tablename__ = "scheduler_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("scheduler_jobs.id", ondelete="CASCADE"), nullable=True)
    status = Column(String(50), default="Pending", nullable=False)  # 'Pending', 'Queued', 'Running', 'Completed', 'Failed', 'Cancelled', 'Retrying'
    triggered_by = Column(String(100), nullable=False)  # 'system', 'admin'
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    modules_executed = Column(JSON, default=list, nullable=False)  # e.g., ['sources_load', 'crawling', ...]
    errors = Column(JSON, default=list, nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)

    job = relationship("SchedulerJob", back_populates="executions")
