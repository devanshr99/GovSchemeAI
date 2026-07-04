"""
Staging and Update Run ORM models.
These support the automatic scheme update pipeline.
Scraped data lands in staging first — never directly into the live schemes table.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, DateTime,
    ForeignKey, Integer, JSON, Float
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class SchemeStagingEntry(Base):
    """
    Staging table for scraped schemes.
    Data flows: Source → SchemeStagingEntry → (Admin Review) → Scheme
    """
    __tablename__ = "scheme_staging"

    id = Column(String(36), primary_key=True, default=generate_uuid)

    # Source tracking
    source_name = Column(String(100), nullable=False, index=True)   # e.g. 'myscheme_gov'
    source_url = Column(String(1000))
    source_id = Column(String(255), index=True)                     # unique ID from source

    # Raw data (full audit trail)
    raw_data = Column(JSON, default=dict)

    # Normalized fields (mapped to Scheme model format)
    normalized_name = Column(String(500))
    normalized_slug = Column(String(255), index=True)
    normalized_data = Column(JSON, default=dict)  # full Scheme-compatible field dict

    # Dedup classification
    match_type = Column(String(20), default="new")  # 'new', 'update', 'duplicate', 'conflict'
    matched_scheme_id = Column(
        String(36), ForeignKey("schemes.id", ondelete="SET NULL"), nullable=True
    )
    confidence_score = Column(Float, default=0.0)   # 0.0–1.0

    # Review workflow
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected, auto_applied
    review_notes = Column(Text, nullable=True)

    # Audit timestamps
    run_id = Column(String(36), ForeignKey("update_runs.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    applied_at = Column(DateTime, nullable=True)

    # Relationships
    matched_scheme = relationship("Scheme", foreign_keys=[matched_scheme_id])
    update_run = relationship("UpdateRun", back_populates="staged_entries")

    def __repr__(self):
        return f"<StagingEntry [{self.status}] {self.normalized_name}>"


class UpdateRun(Base):
    """
    Audit log of each update pipeline execution.
    One row per scheduled/manual run.
    """
    __tablename__ = "update_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_type = Column(String(20), nullable=False)  # 'scheduled', 'manual', 'webhook'

    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Status
    status = Column(String(20), default="running")  # running, completed, failed, partial

    # Metrics
    sources_scraped = Column(JSON, default=list)     # list of source names attempted
    total_fetched = Column(Integer, default=0)
    new_schemes = Column(Integer, default=0)
    updated_schemes = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    errors = Column(JSON, default=list)              # [{source, error, timestamp}]

    # Summary
    summary = Column(Text, nullable=True)

    # Relationships
    staged_entries = relationship("SchemeStagingEntry", back_populates="update_run")

    def __repr__(self):
        return f"<UpdateRun [{self.status}] {self.run_type} @ {self.started_at}>"
