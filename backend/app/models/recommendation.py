import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RecommendationCache(Base):
    """
    Caches pre-computed recommendations for a user.
    """
    __tablename__ = "recommendation_cache"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    recommendations = Column(JSON, nullable=False)  # List of dicts: scheme_id, score, status, explanation
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")

    def __repr__(self):
        return f"<RecommendationCache user={self.user_id} updated_at={self.updated_at}>"


class RecommendationAnalytics(Base):
    """
    Tracks recommendation click-through events, impressions, and acceptances.
    """
    __tablename__ = "recommendation_analytics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), nullable=False)  # 'impression', 'click', 'bookmark', 'apply'
    accepted = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    scheme = relationship("Scheme")

    def __repr__(self):
        return f"<RecommendationAnalytics user={self.user_id} action={self.action} scheme={self.scheme_id}>"
