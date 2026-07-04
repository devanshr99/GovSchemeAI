"""
Scheme and Eligibility ORM models.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Text, Boolean, Date, DateTime,
    ForeignKey, Integer, JSON, Float
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(500), nullable=False)
    name_hi = Column(String(500))
    slug = Column(String(255), unique=True, nullable=False, index=True)
    ministry = Column(String(255))
    department = Column(String(255))
    level = Column(String(20))  # 'central', 'state', 'district'
    state_code = Column(String(5), ForeignKey("states.code"), nullable=True)

    description = Column(Text)
    description_hi = Column(Text)
    benefits = Column(Text)
    benefits_hi = Column(Text)
    benefits_amount = Column(String(255))

    required_documents = Column(JSON, default=list)  # list of strings
    application_process = Column(Text)
    application_process_hi = Column(Text)
    application_url = Column(String(1000))
    official_website = Column(String(1000))
    helpline = Column(String(100))

    deadline = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    scheme_type = Column(JSON, default=list)   # e.g. ['agriculture', 'farmer']
    tags = Column(JSON, default=list)

    launched_date = Column(Date, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Scheme Intelligence fields (Phase 2 Database extension)
    status = Column(String(50), default="active", nullable=False, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    last_checked = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    source_url = Column(String(1000), nullable=True)
    confidence_score = Column(Float, default=1.0, nullable=False)
    scan_id = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    eligibility_rules = relationship("EligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    state = relationship("State", backref="schemes")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", backref="schemes")

    def __repr__(self):
        return f"<Scheme {self.slug}: {self.name}>"


class EligibilityRule(Base):
    """
    Flexible rule storage. Each row is one condition for a scheme.
    
    rule_type: 'age', 'income', 'gender', 'category', 'state', 'occupation',
               'disability', 'is_student', 'is_farmer', 'is_woman', 'is_senior', 'land_holding', 'bpl'
    operator: 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'between', 'bool'
    value: JSON — depends on operator:
        eq/neq/gt/lt/gte/lte: single value, e.g. 18 or "male"
        in/not_in: list, e.g. ["UP", "MP", "RJ"]
        between: {"min": 18, "max": 40}
        bool: true/false
    """
    __tablename__ = "eligibility_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    rule_type = Column(String(50), nullable=False, index=True)
    operator = Column(String(20), nullable=False)
    value = Column(JSON, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    scheme = relationship("Scheme", back_populates="eligibility_rules")

    def __repr__(self):
        return f"<Rule {self.rule_type} {self.operator} {self.value}>"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    name_hi = Column(String(100))
    icon = Column(String(10))
    color = Column(String(7))

    def __repr__(self):
        return f"<Category {self.slug}>"
