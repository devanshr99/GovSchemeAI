"""
Unit and Integration Tests for Government Source Registry (Phase 3).
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.testclient import TestClient

from app.main import app
from app.models.source import GovernmentSource
from app.schemas.source import SourceCreate, SourceUpdate
from app.services.source_service import source_service


@pytest.mark.asyncio
async def test_source_model_creation():
    """Verify ORM instantiates with the correct fields and default parameters."""
    source = GovernmentSource(
        name="Test Agency",
        category="Ministry",
        website_url="https://test.gov.in",
        priority=3,
        is_active=True,
        is_verified=True
    )

    assert source.name == "Test Agency"
    assert source.category == "Ministry"
    assert source.website_url == "https://test.gov.in"
    assert source.priority == 3
    assert source.is_active is True
    assert source.is_verified is True


@pytest.mark.asyncio
async def test_source_create_validations():
    """Verify business validations inside SourceService (HTTPS, duplicates)."""
    # 1. Invalid Category
    with pytest.raises(ValueError, match="Category must be one of"):
        SourceCreate(
            name="Invalid Category Src",
            category="Non-Existent Category",
            website_url="https://category.gov.in"
        )

    # 2. HTTP instead of HTTPS website URL
    with pytest.raises(ValueError, match="must be an HTTPS URL"):
        SourceCreate(
            name="Insecure URL Src",
            category="Portal",
            website_url="http://insecure.gov.in"
        )

    # 3. Duplicate checks in Service CRUD
    source_data = SourceCreate(
        name="Unique Name Src",
        category="Portal",
        website_url="https://unique.gov.in"
    )

    from app.database import get_db, init_db
    await init_db()

    async for db_session in get_db():
        # Create first source successfully
        created = await source_service.create_source(db_session, source_data)
        assert created.id is not None

        # Try duplicate Name
        dup_name = SourceCreate(
            name="Unique Name Src",
            category="Portal",
            website_url="https://different.gov.in"
        )
        with pytest.raises(ValueError, match="already exists"):
            await source_service.create_source(db_session, dup_name)

        # Try duplicate URL
        dup_url = SourceCreate(
            name="Different Name Src",
            category="Portal",
            website_url="https://unique.gov.in"
        )
        with pytest.raises(ValueError, match="already exists"):
            await source_service.create_source(db_session, dup_url)
        
        # Cleanup test entries
        await source_service.delete_source(db_session, created.id)
        break


@pytest.mark.asyncio
async def test_sources_api_endpoints():
    """Verify routing and API endpoints for CRUD operations on sources registry."""
    from app.database import async_session
    from sqlalchemy import delete
    from app.models.source import GovernmentSource
    from app.models.scheme import Scheme
    from app.migrations.db_migration_v3 import run_migration_v3

    async with async_session() as db:
        from app.models.scheme import EligibilityRule, Category
        from app.models.location import State, District
        await db.execute(delete(EligibilityRule))
        await db.execute(delete(Scheme))
        await db.execute(delete(Category))
        await db.execute(delete(District))
        await db.execute(delete(State))
        await db.execute(delete(GovernmentSource))
        await db.commit()

    run_migration_v3()

    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. List Sources
        response = await client.get("/api/admin/sources")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "sources" in data
        assert len(data["sources"]) >= 4  # Includes the 4 default seeded sources

        # 2. Create Source via POST
        new_src = {
            "name": "Custom Ministry of Health",
            "category": "Ministry",
            "website_url": "https://customhealth.gov.in",
            "priority": 5,
            "is_active": True,
            "is_verified": True
        }
        response = await client.post("/api/admin/sources", json=new_src)
        assert response.status_code == 201
        created_data = response.json()
        assert created_data["id"] is not None
        assert created_data["name"] == "Custom Ministry of Health"
        source_id = created_data["id"]

        # 3. Get Source Details
        response = await client.get(f"/api/admin/sources/{source_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Custom Ministry of Health"

        # 4. Update Source via PUT
        update_data = {
            "name": "Updated Ministry Name",
            "priority": 7
        }
        response = await client.put(f"/api/admin/sources/{source_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Ministry Name"
        assert response.json()["priority"] == 7

        # 5. Disable Source Endpoint
        response = await client.post(f"/api/admin/sources/{source_id}/disable")
        assert response.status_code == 200
        assert response.json()["is_active"] is False

        # 6. Enable Source Endpoint
        response = await client.post(f"/api/admin/sources/{source_id}/enable")
        assert response.status_code == 200
        assert response.json()["is_active"] is True

        # 7. Delete Source Endpoint
        response = await client.delete(f"/api/admin/sources/{source_id}")
        assert response.status_code == 200

        # 8. Verify 404 for deleted source
        response = await client.get(f"/api/admin/sources/{source_id}")
        assert response.status_code == 404
