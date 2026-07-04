import os
import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy import select, delete
from app.main import app
from app.database import get_db, init_db, async_session
from app.models.user import User, UserScheme
from app.models.scheme import Scheme, EligibilityRule
from app.models.recommendation import RecommendationCache, RecommendationAnalytics
from app.services.eligibility_engine import RecommendationProfile, eligibility_engine
from app.services.recommendation_engine import recommendation_engine

client = TestClient(app)

@pytest.mark.asyncio
async def test_recommendation_profile_validation():
    """Verify that updating a profile parses types correctly and clears the pre-computed recommendations cache."""
    await init_db()

    async for db in get_db():
        # Setup: Ensure default user exists
        stmt = select(User).where(User.id == "default-test-user-id")
        user = (await db.execute(stmt)).scalar()
        if not user:
            user = User(id="default-test-user-id", name="Default Test User", email="user@yojana.gov.in", profile={})
            db.add(user)
            await db.commit()

        # Clean up any existing cache record first
        await db.execute(delete(RecommendationCache).where(RecommendationCache.user_id == user.id))
        await db.commit()

        # Add a cache record for the user
        cache = RecommendationCache(user_id=user.id, recommendations=[])
        db.add(cache)
        await db.commit()

        # Update profile via API
        profile_payload = {
            "age": 25,
            "gender": "female",
            "state": "Uttar Pradesh",
            "annual_income": 150000.0,
            "occupation": "student",
            "is_student": True,
            "bpl_status": False
        }
        resp = client.post(
            "/api/recommendations/profile?token=default-test-user-id",
            json=profile_payload
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["profile"]["age"] == 25
        assert data["profile"]["gender"] == "female"

        # Verify that the cache record was invalidated/cleared
        cache_stmt = select(RecommendationCache).where(RecommendationCache.user_id == user.id)
        cached = (await db.execute(cache_stmt)).scalar()
        assert cached is None


@pytest.mark.asyncio
async def test_eligibility_engine_rules():
    """Verify deterministic rule evaluations (Eligible, Not Eligible, Unknown)."""
    # Create mock scheme with rules
    scheme = Scheme(
        id="test-eligibility-scheme-id",
        name="Test Scheme with Rules",
        slug="test-scheme-rules",
        is_active=True
    )
    # Mandatory Age Rule (min 18)
    age_rule = EligibilityRule(
        scheme_id=scheme.id,
        rule_type="age",
        operator="gte",
        value=18,
        is_mandatory=True,
        description="Minimum age must be 18"
    )
    # Optional Income Rule (under 2 Lakh)
    income_rule = EligibilityRule(
        scheme_id=scheme.id,
        rule_type="income",
        operator="lt",
        value=200000.0,
        is_mandatory=False,
        description="Income should be less than 2 Lakh"
    )
    scheme.eligibility_rules = [age_rule, income_rule]

    # Case 1: Eligible (Age 20, Income 1.5 Lakh)
    profile_1 = RecommendationProfile(age=20, annual_income=150000.0)
    res_1 = eligibility_engine.evaluate_scheme(scheme, profile_1)
    assert res_1["status"] == "Eligible"
    assert res_1["is_eligible"] is True

    # Case 2: Not Eligible (Age 15, fails mandatory age rule)
    profile_2 = RecommendationProfile(age=15, annual_income=150000.0)
    res_2 = eligibility_engine.evaluate_scheme(scheme, profile_2)
    assert res_2["status"] == "Not Eligible"
    assert res_2["is_eligible"] is False

    # Case 3: Possibly Eligible (Age 20, Income 2.5 Lakh - fails optional rule but passes mandatory)
    profile_3 = RecommendationProfile(age=20, annual_income=250000.0)
    res_3 = eligibility_engine.evaluate_scheme(scheme, profile_3)
    assert res_3["status"] == "Possibly Eligible"

    # Case 4: Unknown (Age is missing)
    profile_4 = RecommendationProfile(annual_income=150000.0)
    res_4 = eligibility_engine.evaluate_scheme(scheme, profile_4)
    assert res_4["status"] == "Unknown"
    assert res_4["is_eligible"] is False


@pytest.mark.asyncio
async def test_recommendation_scoring_and_ranking():
    """Verify scoring logic, popularity boosts, state location boosters, and smart filtering API."""
    await init_db()

    async for db in get_db():
        # Setup: Ensure scheme and user records exist
        # Re-create cleaner scheme records
        await db.execute(delete(Scheme).where(Scheme.slug == "test-ranking-state-scheme"))
        await db.execute(delete(Scheme).where(Scheme.slug == "test-ranking-central-scheme"))
        await db.commit()

        state_scheme = Scheme(
            name="UP State Scheme",
            slug="test-ranking-state-scheme",
            level="state",
            state_code="UP",
            scheme_type=["farmer"],
            is_active=True
        )
        central_scheme = Scheme(
            name="Central Farmer Scheme",
            slug="test-ranking-central-scheme",
            level="central",
            scheme_type=["farmer"],
            is_active=True
        )
        db.add_all([state_scheme, central_scheme])
        await db.commit()

        # Build user profile for UP farmer
        profile = RecommendationProfile(
            state="Uttar Pradesh",
            occupation="farmer",
            is_farmer=True
        )

        # Get popularity metrics
        pop_map = await recommendation_engine.get_popularity_metrics(db)

        # Rank
        ranked = await recommendation_engine.rank_schemes(db, profile, pop_map)
        
        # Verify state scheme is scored higher than central scheme for UP user (due to location boost)
        state_score = next(r["score"] for r in ranked if r["slug"] == "test-ranking-state-scheme")
        central_score = next(r["score"] for r in ranked if r["slug"] == "test-ranking-central-scheme")
        assert state_score > central_score

        # Verify explanations details contain location references
        state_rec = next(r for r in ranked if r["slug"] == "test-ranking-state-scheme")
        assert any("State-specific" in reason or "Uttar Pradesh" in reason for reason in state_rec["brief_reasons"])


@pytest.mark.asyncio
async def test_recommendations_and_comparison_api():
    """Verify endpoints for matching, comparisons, and click analytics tracking."""
    await init_db()

    async for db in get_db():
        # Setup test schemes
        await db.execute(delete(Scheme).where(Scheme.slug.in_(["scheme-comp-1", "scheme-comp-2"])))
        await db.commit()

        s1 = Scheme(id="scheme-comp-1-id", name="Compare Scheme 1", slug="scheme-comp-1", is_active=True, benefits_amount="5000", required_documents=["Aadhaar"])
        s2 = Scheme(id="scheme-comp-2-id", name="Compare Scheme 2", slug="scheme-comp-2", is_active=True, benefits_amount="10000", required_documents=["PAN"])
        db.add_all([s1, s2])
        await db.commit()

        # 1. Test comparison grid
        comp_resp = client.get("/api/recommendations/comparison?scheme_ids=scheme-comp-1-id&scheme_ids=scheme-comp-2-id")
        assert comp_resp.status_code == 200
        comp_data = comp_resp.json()
        assert comp_data["scheme-comp-1-id"]["name"] == "Compare Scheme 1"
        assert comp_data["scheme-comp-2-id"]["benefits_amount"] == "10000"

        # 2. Test analytics tracking clicks
        track_resp = client.post(
            "/api/recommendations/track?token=default-test-user-id",
            json={"scheme_id": "scheme-comp-1-id", "action": "click"}
        )
        assert track_resp.status_code == 200
        assert track_resp.json()["status"] == "success"

        # Verify recorded in DB
        stmt = select(RecommendationAnalytics).where(RecommendationAnalytics.scheme_id == "scheme-comp-1-id")
        analytics = (await db.execute(stmt)).scalars().all()
        assert len(analytics) > 0
        assert analytics[0].action == "click"

        # 3. Test Dashboard statistics
        dash_resp = client.get("/api/recommendations/dashboard?token=default-test-user-id")
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert "total_matches" in dash_data
        assert "eligibility_summary" in dash_data

        # Cleanup
        for a in analytics:
            await db.delete(a)
        await db.delete(s1)
        await db.delete(s2)
        await db.commit()
