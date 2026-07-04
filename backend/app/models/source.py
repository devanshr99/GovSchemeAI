"""
Government Source ORM Model.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class GovernmentSource(Base):
    __tablename__ = "government_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # e.g., 'Portal', 'RSS Feed'
    website_url = Column(String(1000), unique=True, nullable=False)
    rss_url = Column(String(1000), nullable=True)
    sitemap_url = Column(String(1000), nullable=True)
    state = Column(String(100), nullable=True)
    ministry = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    priority = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)

    def __repr__(self):
        return f"<GovernmentSource {self.name}: {self.category}>"
