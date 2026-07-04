"""
Chat API router — AI assistant for scheme queries.
Chat messages are persisted to the database for session continuity.
"""

import uuid
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import ai_service
from app.models.chat import ChatMessage

logger = logging.getLogger("yojana.chat")

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """AI chat about government schemes. Messages are persisted for session continuity."""
    session_id = request.session_id or str(uuid.uuid4())

    # Load previous messages in this session (last 6 turns = 12 messages)
    chat_history: list[dict] = []
    try:
        history_stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(12)
        )
        history_result = await db.execute(history_stmt)
        past_messages = list(reversed(history_result.scalars().all()))
        chat_history = [{"role": m.role, "content": m.content} for m in past_messages]
    except Exception as e:
        logger.warning(f"Failed to load chat history for session {session_id}: {e}")

    # Retrieve relevant context from database
    from app.services.rag_service import rag_service
    context = await rag_service.get_relevant_context(db, request.message)

    # Generate AI response
    response_text = await ai_service.chat_response(
        user_message=request.message,
        context=context,
        chat_history=chat_history,
        language=request.language,
    )

    # Persist user message and AI response to DB
    try:
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=request.message,
            metadata_={},
        )
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=response_text,
            metadata_={},
        )
        db.add(user_msg)
        db.add(assistant_msg)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to persist chat messages: {e}")
        # Non-fatal: response is still returned even if DB write fails

    # Suggest follow-up questions
    suggested = [
        "What schemes am I eligible for?",
        "How to apply for PM-KISAN?",
        "What documents do I need for Ayushman Bharat?",
    ]
    if request.language == "hi":
        suggested = [
            "मैं किन योजनाओं के लिए पात्र हूं?",
            "PM-KISAN के लिए कैसे आवेदन करें?",
            "आयुष्मान भारत के लिए कौन से दस्तावेज चाहिए?",
        ]

    # Extract source scheme names from context
    sources = []
    if context:
        for line in context.split("\n"):
            if line.startswith("Scheme Name:"):
                name = line.replace("Scheme Name:", "").strip()
                if name:
                    sources.append(name)

    return ChatResponse(
        response=response_text,
        session_id=session_id,
        sources=sources,
        suggested_questions=suggested,
    )


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve chat history for a session."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]
