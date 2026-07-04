import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.eligibility import EligibilityRequest, EligibilityResponse
from app.services.eligibility_engine import eligibility_engine
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility"])


@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(
    request: EligibilityRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit user profile and get matching government schemes.
    
    The engine evaluates all active schemes' eligibility rules against
    the provided profile and returns scored results.
    """
    result = await eligibility_engine.check_eligibility(db, request)

    tasks = []

    # Generate AI explanations for top schemes concurrently (limit to top 5 to control cost)
    schemes_to_explain = result.schemes[:5]
    for scheme in schemes_to_explain:
        async def explain_one(s):
            try:
                explanation = await ai_service.explain_eligibility(
                    scheme_name=s.name,
                    scheme_benefits=s.benefits or s.benefits_amount or "",
                    eligibility_rules=[
                        f"Matched {s.rules_matched}/{s.rules_total} criteria"
                    ],
                    user_profile_summary=result.profile_summary,
                    match_score=s.match_score,
                    language=request.language,
                )
                s.ai_explanation = explanation
            except Exception:
                s.ai_explanation = None
        tasks.append(explain_one(scheme))

    # Generate overall AI summary concurrently
    if result.eligible_count > 0:
        scheme_names = [s.name for s in result.schemes[:10]]
        summary_prompt = (
            f"User profile: {result.profile_summary}\n"
            f"Eligible for {result.eligible_count} schemes: {', '.join(scheme_names)}\n\n"
            "Write a 2-3 sentence summary of the most important schemes this person should "
            "apply for first and why. Be specific about benefits."
        )
        async def generate_summary():
            try:
                result.ai_summary = await ai_service.generate(
                    summary_prompt,
                    system_prompt="You are GovSchemeAI. Be concise and actionable.",
                    max_tokens=200,
                )
            except Exception:
                result.ai_summary = None
        tasks.append(generate_summary())

    if tasks:
        await asyncio.gather(*tasks)

    return result
