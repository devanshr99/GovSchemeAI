"""
Chat history ORM model.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ChatMessage(Base):
    __tablename__ = "chat_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(255), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    role = Column(String(10), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ChatMessage {self.role}: {self.content[:50]}>"
