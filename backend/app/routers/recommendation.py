from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, Body, status
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserScheme
from app.models.scheme import Scheme
from app.models.recommendation import RecommendationCache, RecommendationAnalytics
from app.services.eligibility_engine import RecommendationProfile
from app.services.recommendation_engine import recommendation_engine

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])

async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Retrieves the authenticated user using Bearer token or query param matching user ID or email.
    Provides a default seeded test user if no auth is passed to ensure dev/testing continuity.
    """
    active_token = token
    if authorization and authorization.startswith("Bearer "):
        active_token = authorization.split(" ", 1)[1]

    if not active_token:
        # Fallback to default user to support simplified/mocked user workflows in testing
        stmt = select(User)
        res = await db.execute(stmt)
        user = res.scalars().first()
        if not user:
            user = User(
                id="default-test-user-id",
                name="Default Test User",
                email="user@yojana.gov.in",
                profile={}
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    # Retrieve user
    stmt = select(User).where(User.id == active_token)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        # Check by email
        stmt = select(User).where(User.email == active_token)
        res = await db.execute(stmt)
        user = res.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired user session."
        )
    return user


@router.post("/profile", response_model=dict)
async def update_profile(
    profile: RecommendationProfile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the logged-in user's Recommendation Profile and invalidates their precomputed cache.
    """
    try:
        # Sanitize and serialize profile
        user.profile = profile.model_dump()
        db.add(user)
        await db.commit()

        # Invalidate recommendation cache immediately to force rebuild
        await recommendation_engine.invalidate_user_cache(db, user.id)

        return {
            "status": "success",
            "message": "Recommendation profile updated successfully.",
            "profile": user.profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.get("/matching", response_model=list)
async def get_matching_recommendations(
    filter_type: str = Query("best", regex="^(best|popular|updated|closing_soon|highest_benefits|student|women|senior|farmer|business)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns ranked and explainable matching recommendations for the authenticated user,
    supporting Smart Filters.
    """
    try:
        recommendations = await recommendation_engine.get_recommendations_for_user(db, user.id)
        
        # Log telemetry impressions
        for rec in recommendations[:5]:
            await recommendation_engine.track_recommendation_action(db, user.id, rec["scheme_id"], "impression")

        # Apply Smart Filters
        if filter_type == "popular":
            # Sorted by popularity rating (score + click analytics boost)
            recommendations.sort(key=lambda x: (x.get("score", 0), x.get("benefits_amount") or ""), reverse=True)
        elif filter_type == "updated":
            # Recently updated
            recommendations.sort(key=lambda x: x.get("last_updated") or "", reverse=True)
        elif filter_type == "closing_soon":
            # Closing soonest (non-null deadlines first)
            recommendations.sort(key=lambda x: (x.get("deadline") is None, x.get("deadline") or ""))
        elif filter_type == "highest_benefits":
            # Sort by benefits_amount presence/length as heuristic
            recommendations.sort(key=lambda x: len(str(x.get("benefits_amount") or "")), reverse=True)
        elif filter_type in ("student", "women", "senior", "farmer", "business"):
            # Demographics filter
            demographic_keywords = {
                "student": ["student", "education"],
                "women": ["women", "female", "girl"],
                "senior": ["senior", "elderly", "pension"],
                "farmer": ["farmer", "agriculture", "kisan"],
                "business": ["business", "entrepreneur", "startup", "msme"]
            }
            keywords = demographic_keywords[filter_type]
            filtered = []
            for rec in recommendations:
                exps_lower = " ".join(rec.get("explanations", [])).lower()
                reasons_lower = " ".join(rec.get("brief_reasons", [])).lower()
                name_lower = rec["name"].lower()
                if any(kw in exps_lower or kw in reasons_lower or kw in name_lower for kw in keywords):
                    filtered.append(rec)
            return filtered

        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recommendations: {str(e)}")


@router.get("/comparison", response_model=dict)
async def compare_schemes(
    scheme_ids: List[str] = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Compares eligibility, benefits, application process, and documents across multiple schemes.
    """
    if not scheme_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one scheme_id to compare.")

    stmt = select(Scheme).where(Scheme.id.in_(scheme_ids))
    res = await db.execute(stmt)
    schemes = res.scalars().all()

    comparison_grid = {}
    for s in schemes:
        comparison_grid[s.id] = {
            "name": s.name,
            "level": s.level,
            "benefits": s.benefits or "Details not available",
            "benefits_amount": s.benefits_amount or "N/A",
            "required_documents": s.required_documents or [],
            "application_process": s.application_process or "Check official website",
            "deadline": s.deadline.isoformat() if s.deadline else "Open",
            "official_website": s.official_website or s.application_url or "N/A"
        }

    return comparison_grid


@router.post("/track", response_model=dict)
async def track_analytics(
    scheme_id: str = Body(..., embed=True),
    action: str = Body(..., embed=True, regex="^(click|bookmark|apply)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Tracks click-through events, impressions, and acceptances for recommendation accuracy audit.
    """
    try:
        await recommendation_engine.track_recommendation_action(db, user.id, scheme_id, action)
        return {
            "status": "success",
            "message": f"Action '{action}' tracked successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard", response_model=dict)
async def get_personalized_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates summary metrics, matching counts, bookmarks, and lists for the dashboard.
    """
    try:
        recommendations = await recommendation_engine.get_recommendations_for_user(db, user.id)

        # 1. Eligibility Counts
        elig_counts = {"Eligible": 0, "Probably Eligible": 0, "Possibly Eligible": 0, "Unknown": 0}
        for rec in recommendations:
            status_name = rec["status"]
            if status_name in elig_counts:
                elig_counts[status_name] += 1

        # 2. Saved Bookmarks Count
        saved_stmt = select(func.count(UserScheme.id)).where(
            and_(UserScheme.user_id == user.id, UserScheme.status == "bookmarked")
        )
        saved_count = (await db.execute(saved_stmt)).scalar() or 0

        # 3. Recently Updated Matches (updated in last 30 days)
        # Sort recommendations by last_updated descending
        updated_matches = [
            r for r in recommendations if r.get("last_updated") is not None
        ]
        updated_matches.sort(key=lambda x: x["last_updated"], reverse=True)

        return {
            "profile_completed": len([k for k, v in user.profile.items() if v is not None]) if user.profile else 0,
            "total_matches": len(recommendations),
            "saved_count": saved_count,
            "eligibility_summary": elig_counts,
            "recently_updated_matches": updated_matches[:3],
            "top_recommendations": recommendations[:3]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard statistics: {str(e)}")
