"""
Chat request/response schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    language: str = Field("en", pattern="^(en|hi)$")
    context: Optional[dict] = None  # optional user profile for contextual answers


class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: list[str] = []
    suggested_questions: list[str] = []
