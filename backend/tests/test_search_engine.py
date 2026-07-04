import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.config import get_settings
from app.database import get_db, init_db
from app.models.scheme import Scheme, EligibilityRule, Category
from app.models.search_history import SearchHistory

client = TestClient(app)
settings = get_settings()


@pytest.mark.asyncio
async def test_intelligent_search_and_filtering():
    """Verifies synonym expansion, eligibility filtering, autocomplete, and search analytics."""
    await init_db()

    async for db in get_db():
        # Setup: Create category, scheme, and eligibility rules
        cat = Category(name="Agriculture Test", slug="agri-test")
        db.add(cat)
        await db.commit()
        await db.refresh(cat)

        scheme = Scheme(
            name="Krishi Kalyan Yojana",
            slug="krishi-kalyan-yojana",
            description="Support for rural cultivators and farmers.",
            benefits="Direct bank transfer for seeds.",
            ministry="Ministry of Agriculture",
            department="Department of Agriculture",
            state_code="MH",
            level="state",
            is_active=True,
            category_id=cat.id
        )
        db.add(scheme)
        await db.commit()
        await db.refresh(scheme)

        rule_age = EligibilityRule(
            scheme_id=scheme.id,
            rule_type="age",
            operator="between",
            value={"min": 18, "max": 50}
        )
        rule_income = EligibilityRule(
            scheme_id=scheme.id,
            rule_type="income",
            operator="lte",
            value=200000
        )
        rule_gender = EligibilityRule(
            scheme_id=scheme.id,
            rule_type="gender",
            operator="eq",
            value="Female"
        )
        db.add(rule_age)
        db.add(rule_income)
        db.add(rule_gender)
        await db.commit()

        # 1. Test Autocomplete suggestion endpoint
        resp = client.get("/api/search/autocomplete?prefix=krishi")
        assert resp.status_code == 200
        data = resp.json()
        assert "Krishi Kalyan Yojana" in data["suggestions"]

        # 2. Test Synonym search expansion ("kisan" -> "farmer" -> "krishi")
        resp = client.get("/api/search?q=kisan")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) >= 1
        assert any(item["name"] == "Krishi Kalyan Yojana" for item in data["results"])

        # 3. Test Eligibility range filters (Success cases)
        resp = client.get("/api/search?q=krishi&age=30&gender=Female&income=150000")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) >= 1
        assert any(item["name"] == "Krishi Kalyan Yojana" for item in data["results"])

        # 4. Test Eligibility range filters (Failure - invalid age)
        resp = client.get("/api/search?q=krishi&age=60&gender=Female&income=150000")
        assert resp.status_code == 200
        data = resp.json()
        assert not any(item["name"] == "Krishi Kalyan Yojana" for item in data["results"])

        # 5. Test Eligibility range filters (Failure - invalid income)
        resp = client.get("/api/search?q=krishi&age=30&gender=Female&income=300000")
        assert resp.status_code == 200
        data = resp.json()
        assert not any(item["name"] == "Krishi Kalyan Yojana" for item in data["results"])

        # 6. Test Eligibility range filters (Failure - invalid gender)
        resp = client.get("/api/search?q=krishi&age=30&gender=Male&income=150000")
        assert resp.status_code == 200
        data = resp.json()
        assert not any(item["name"] == "Krishi Kalyan Yojana" for item in data["results"])

        # 7. Test History Logging and limit
        resp = client.get("/api/search/history?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert any(item["query"] == "kisan" for item in data)

        # 8. Test Search Analytics endpoint
        resp = client.get("/api/search/analytics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_searches"] >= 1
        assert data["average_latency_ms"] >= 0.0

        # Cleanup
        await db.delete(rule_age)
        await db.delete(rule_income)
        await db.delete(rule_gender)
        await db.delete(scheme)
        await db.delete(cat)
        # Clear search history from test run
        q_history = await db.execute(select(SearchHistory))
        for item in q_history.scalars().all():
            await db.delete(item)
        await db.commit()
        break
