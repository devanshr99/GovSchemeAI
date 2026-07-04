"""
User ORM models (Phase 2+ — auth). Included now for schema completeness.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(15), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255))
    password_hash = Column(String(255))
    profile = Column(JSON, default=dict)        # eligibility profile snapshot
    preferred_language = Column(String(5), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    saved_schemes = relationship("UserScheme", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email or self.phone}>"


class UserScheme(Base):
    __tablename__ = "user_schemes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="bookmarked")  # bookmarked, applied, approved, rejected
    applied_at = Column(DateTime, nullable=True)
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_schemes")
    scheme = relationship("Scheme")

    def __repr__(self):
        return f"<UserScheme user={self.user_id} scheme={self.scheme_id}>"
