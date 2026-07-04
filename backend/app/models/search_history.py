import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class SearchHistory(Base):
    """
    Logs metadata and performance statistics for user search queries.
    """
    __tablename__ = "search_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    query = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    results_count = Column(Integer, default=0, nullable=False)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    filters_used = Column(JSON, default=dict, nullable=False)
