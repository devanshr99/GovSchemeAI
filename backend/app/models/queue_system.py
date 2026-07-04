import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class QueueJob(Base):
    """
    Represents background tasks enqueued for concurrent processing.
    """
    __tablename__ = "queue_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_name = Column(String(100), nullable=False)  # 'crawl_source', 'process_ai', 'database_sync'
    payload = Column(JSON, default=dict, nullable=False)
    priority = Column(Integer, default=1, index=True, nullable=False)  # Higher is prioritized
    status = Column(String(50), default="Pending", index=True, nullable=False)  # 'Pending', 'Queued', 'Running', 'Retrying', 'Completed', 'Failed', 'Cancelled', 'Dead Letter'
    run_after = Column(DateTime, nullable=True)  # Used for delayed runs or exponential backoff sleep
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    error_message = Column(String(1000), nullable=True)
    dead_letter_reason = Column(String(1000), nullable=True)
    worker_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class WorkerStatus(Base):
    """
    Tracks concurrency stats and resource heartbeats for background workers.
    """
    __tablename__ = "worker_status"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    status = Column(String(50), default="active", nullable=False)  # 'active', 'idle', 'unhealthy', 'stopped'
    last_heartbeat = Column(DateTime, default=datetime.utcnow, nullable=False)
    running_jobs_count = Column(Integer, default=0, nullable=False)
    completed_jobs_count = Column(Integer, default=0, nullable=False)
    failed_jobs_count = Column(Integer, default=0, nullable=False)
    restart_count = Column(Integer, default=0, nullable=False)
    cpu_usage = Column(Float, default=0.0, nullable=False)
    memory_usage = Column(Float, default=0.0, nullable=False)
