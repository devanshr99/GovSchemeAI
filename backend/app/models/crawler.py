"""
Crawler Crawl Queue ORM Model.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class CrawlQueueItem(Base):
    __tablename__ = "crawl_queue"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    url = Column(String(1000), nullable=False, index=True)
    content_hash = Column(String(64), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # e.g., 'scheme_page', 'news_page'
    language = Column(String(20), nullable=False, index=True)  # e.g., 'en', 'hi', 'bilingual'
    quality_score = Column(Integer, nullable=False)  # 0 to 100
    clean_text = Column(Text, nullable=False)
    status = Column(String(20), default="queued", nullable=False, index=True)  # 'queued', 'processed', 'ignored'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    metadata_ = Column("metadata", JSON, default=dict, nullable=False)

    def __repr__(self):
        return f"<CrawlQueueItem [{self.status}] {self.url[:50]}>"


class CrawlExtraction(Base):
    __tablename__ = "crawl_extractions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    queue_item_id = Column(
        String(36),
        ForeignKey("crawl_queue.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    extracted_data = Column(JSON, default=dict, nullable=False)
    validation_report = Column(JSON, default=dict, nullable=False)
    duplicate_report = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CrawlExtraction queue_id={self.queue_item_id[:8]} id={self.id[:8]}>"
