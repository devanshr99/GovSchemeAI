"""
Chat API router — AI assistant for scheme queries.
Chat messages are persisted to the database for session continuity.
"""

import uuid
import logging
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import ai_service
from app.models.chat import ChatMessage
from app.models.scheme import Scheme

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

    # Build demographic/eligibility context from request.context if present
    profile_context = ""
    if request.context:
        try:
            from app.services.eligibility_engine import RecommendationProfile, eligibility_engine
            profile = RecommendationProfile(
                age=request.context.get("age"),
                gender=request.context.get("gender"),
                state=request.context.get("state"),
                district=request.context.get("district"),
                occupation=request.context.get("occupation"),
                annual_income=request.context.get("annual_income"),
                category=request.context.get("category"),
                disability=request.context.get("disability"),
                is_student=request.context.get("is_student"),
                is_farmer=request.context.get("is_farmer"),
                is_woman=request.context.get("is_woman"),
                is_senior_citizen=request.context.get("is_senior_citizen"),
                bpl_status=request.context.get("is_bpl"),
                land_holding=request.context.get("land_holding_hectares")
            )
            
            # Fetch active schemes
            stmt = select(Scheme).where(Scheme.is_active == True).options(selectinload(Scheme.eligibility_rules))
            res = await db.execute(stmt)
            schemes = res.scalars().all()
            
            eligible_names = []
            partially_eligible = []
            rules_breakdowns = []
            
            for scheme in schemes:
                eval_res = eligibility_engine.evaluate_scheme(scheme, profile)
                if eval_res["status"] == "Eligible":
                    eligible_names.append(scheme.name)
                elif eval_res["status"] in ("Probably Eligible", "Possibly Eligible"):
                    partially_eligible.append(f"{scheme.name} ({eval_res['status']})")
                
                # If scheme is mentioned in the query, include its detailed checklist
                query_lower = request.message.lower()
                if (scheme.name and scheme.name.lower() in query_lower) or (scheme.slug and scheme.slug.replace("-", " ") in query_lower):
                    breakdown = f"Eligibility checklist details for {scheme.name}:\n" + "\n".join(eval_res["explanations"])
                    rules_breakdowns.append(breakdown)
            
            profile_context = (
                f"User Profile details:\n"
                f"- Age: {profile.age}\n"
                f"- Gender: {profile.gender}\n"
                f"- State: {profile.state}\n"
                f"- Occupation: {profile.occupation}\n"
                f"- Annual Income: ₹{profile.annual_income}\n"
                f"- Category: {profile.category}\n"
                f"- BPL Status: {profile.bpl_status}\n"
                f"- Disability: {profile.disability}\n\n"
                f"Deterministically Eligible Schemes: {', '.join(eligible_names) if eligible_names else 'None'}\n"
                f"Partially Eligible Schemes: {', '.join(partially_eligible) if partially_eligible else 'None'}\n"
            )
            if rules_breakdowns:
                profile_context += "\n" + "\n\n".join(rules_breakdowns) + "\n"
                
        except Exception as ex:
            logger.warning(f"Failed to evaluate eligibility context for chat: {ex}")

    # Retrieve relevant context from database (RAG lookup)
    from app.services.rag_service import rag_service
    rag_context = await rag_service.get_relevant_context(db, request.message)

    combined_context = (
        f"{profile_context}\n"
        f"Retrieval Context:\n{rag_context}"
    )

    # Generate AI response
    response_text = await ai_service.chat_response(
        user_message=request.message,
        context=combined_context,
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

    # Suggest follow-up questions
    suggested = [
        "Which schemes am I eligible for?",
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
    if rag_context:
        for line in rag_context.split("\n"):
            if line.startswith("Scheme Name:"):
                name = line.replace("Scheme Name:", "").strip()
                if name and name not in sources:
                    sources.append(name)

    return ChatResponse(
        response=response_text,
        session_id=session_id,
        sources=sources,
        suggested_questions=suggested,
    )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """AI chat about government schemes with real-time SSE token streaming."""
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

    # Build demographic/eligibility context from request.context if present
    profile_context = ""
    if request.context:
        try:
            from app.services.eligibility_engine import RecommendationProfile, eligibility_engine
            profile = RecommendationProfile(
                age=request.context.get("age"),
                gender=request.context.get("gender"),
                state=request.context.get("state"),
                district=request.context.get("district"),
                occupation=request.context.get("occupation"),
                annual_income=request.context.get("annual_income"),
                category=request.context.get("category"),
                disability=request.context.get("disability"),
                is_student=request.context.get("is_student"),
                is_farmer=request.context.get("is_farmer"),
                is_woman=request.context.get("is_woman"),
                is_senior_citizen=request.context.get("is_senior_citizen"),
                bpl_status=request.context.get("is_bpl"),
                land_holding=request.context.get("land_holding_hectares")
            )
            
            # Fetch active schemes
            stmt = select(Scheme).where(Scheme.is_active == True).options(selectinload(Scheme.eligibility_rules))
            res = await db.execute(stmt)
            schemes = res.scalars().all()
            
            eligible_names = []
            partially_eligible = []
            rules_breakdowns = []
            
            for scheme in schemes:
                eval_res = eligibility_engine.evaluate_scheme(scheme, profile)
                if eval_res["status"] == "Eligible":
                    eligible_names.append(scheme.name)
                elif eval_res["status"] in ("Probably Eligible", "Possibly Eligible"):
                    partially_eligible.append(f"{scheme.name} ({eval_res['status']})")
                
                # If scheme is mentioned in the query, include its detailed checklist
                query_lower = request.message.lower()
                if (scheme.name and scheme.name.lower() in query_lower) or (scheme.slug and scheme.slug.replace("-", " ") in query_lower):
                    breakdown = f"Eligibility checklist details for {scheme.name}:\n" + "\n".join(eval_res["explanations"])
                    rules_breakdowns.append(breakdown)
            
            profile_context = (
                f"User Profile details:\n"
                f"- Age: {profile.age}\n"
                f"- Gender: {profile.gender}\n"
                f"- State: {profile.state}\n"
                f"- Occupation: {profile.occupation}\n"
                f"- Annual Income: ₹{profile.annual_income}\n"
                f"- Category: {profile.category}\n"
                f"- BPL Status: {profile.bpl_status}\n"
                f"- Disability: {profile.disability}\n\n"
                f"Deterministically Eligible Schemes: {', '.join(eligible_names) if eligible_names else 'None'}\n"
                f"Partially Eligible Schemes: {', '.join(partially_eligible) if partially_eligible else 'None'}\n"
            )
            if rules_breakdowns:
                profile_context += "\n" + "\n\n".join(rules_breakdowns) + "\n"
                
        except Exception as ex:
            logger.warning(f"Failed to evaluate eligibility context for chat: {ex}")

    # Retrieve relevant context from database (RAG lookup)
    from app.services.rag_service import rag_service
    rag_context = await rag_service.get_relevant_context(db, request.message)

    combined_context = (
        f"{profile_context}\n"
        f"Retrieval Context:\n{rag_context}"
    )

    async def stream_generator():
        accumulated_text = ""
        try:
            async for chunk in ai_service.chat_response_stream(
                user_message=request.message,
                context=combined_context,
                chat_history=chat_history,
                language=request.language,
            ):
                accumulated_text += chunk
                yield f"data: {json.dumps({'text': chunk, 'session_id': session_id})}\n\n"
        except Exception as e:
            logger.error(f"Chat streaming error: {e}")
            yield f"data: {json.dumps({'error': 'Streaming interrupted due to provider error.', 'session_id': session_id})}\n\n"
        
        # Persist messages after generation finishes
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
                content=accumulated_text,
                metadata_={},
            )
            db.add(user_msg)
            db.add(assistant_msg)
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to persist streamed chat messages: {e}")

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


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
