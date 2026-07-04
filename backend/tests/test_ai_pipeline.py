"""
Unit and Integration Tests for AI Processing Pipeline (Phase 5).
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.services.ai_pipeline import ai_pipeline
from app.database import get_db, init_db
from app.models.crawler import CrawlQueueItem


@pytest.mark.asyncio
async def test_extraction_parsing_with_markdown_wrap():
    """Verify Extraction Agent cleans and parses markdown-wrapped json strings."""
    mock_llm_response = """
    ```json
    {
      "scheme_name": "Mock Test Scheme",
      "short_description": "A test yojana scheme details.",
      "benefits": "Provides INR 5000 support annually.",
      "eligibility": "Farmers with less than 2 hectares of land.",
      "official_url": "https://farmers.gov.in"
    }
    ```
    """

    with patch("app.services.ai_service.ai_service.generate", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_llm_response

        extracted = await ai_pipeline.run_extraction_agent("clean content payload")
        assert extracted["scheme_name"] == "Mock Test Scheme"
        assert extracted["benefits"] == "Provides INR 5000 support annually."
        assert "official_url" in extracted


@pytest.mark.asyncio
async def test_validation_agent_metrics():
    """Verify confidence score calculations, warnings, and missing fields."""
    # 1. Complete Gov Scheme
    data_complete = {
        "scheme_name": "Ayushman Bharat",
        "short_description": "Universal healthcare coverage support.",
        "benefits": "Free treatment up to 5 lakhs.",
        "official_url": "https://ayushman.gov.in"
    }
    report = await ai_pipeline.run_validation_agent(data_complete)
    assert report["status"] == "valid"
    assert report["confidence_score"] == 1.0
    assert len(report["missing_fields"]) == 0
    assert len(report["warnings"]) == 0

    # 2. Scheme missing required description field
    data_missing = {
        "scheme_name": "PM Kisan",
        "benefits": "INR 6000 support."
    }
    report_missing = await ai_pipeline.run_validation_agent(data_missing)
    assert "short_description" in report_missing["missing_fields"]
    assert report_missing["confidence_score"] == 0.75  # Lost 0.25 points

    # 3. Unofficial domain warning check
    data_unofficial = {
        "scheme_name": "PM Kisan Private Blog",
        "short_description": "Details about PM Kisan yojana.",
        "benefits": "INR 6000 support.",
        "official_url": "https://pmkisanblog.com/apply"
    }
    report_unofficial = await ai_pipeline.run_validation_agent(data_unofficial)
    assert any("government domain" in w for w in report_unofficial["warnings"])
    assert report_unofficial["confidence_score"] == 0.85  # Lost 0.15 points


@pytest.mark.asyncio
async def test_duplicate_detection_agent():
    """Verify Duplicate Detection Agent computes name token sort ratios correctly."""
    from app.database import get_db, init_db
    await init_db()
    from app.utils.seed_data import seed_if_empty
    await seed_if_empty()

    # We run the duplicate check using get_db session context
    async for db in get_db():
        # High confidence duplicate check
        report_dup = await ai_pipeline.run_duplicate_agent(db, "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)")
        assert report_dup["status"] == "duplicate"
        assert report_dup["similarity_score"] >= 0.85

        # Unique scheme check
        report_unique = await ai_pipeline.run_duplicate_agent(db, "Completely Non-Existent Scheme Name 2026")
        assert report_unique["status"] == "unique"
        assert report_unique["similarity_score"] < 0.50
        break


@pytest.mark.asyncio
async def test_ai_pipeline_orchestrator():
    """Verify process_queue_item cleanses, triggers agents, and persists extracted data."""
    from app.database import get_db, init_db
    await init_db()

    # Seed a mock queue item
    queue_item = CrawlQueueItem(
        url="https://test.gov.in/scheme-test",
        content_hash="mock_hash_string_extractions_check",
        category="Scheme Page",
        language="en",
        quality_score=85,
        clean_text="This page contains details for Test Scheme. It is a universal health scheme. Benefits: Free treatment. Official website: https://test.gov.in"
    )

    mock_llm_response = """
    {
      "scheme_name": "Test Scheme",
      "short_description": "Universal health scheme.",
      "benefits": "Free treatment.",
      "official_url": "https://test.gov.in"
    }
    """

    async for db in get_db():
        db.add(queue_item)
        await db.commit()
        await db.refresh(queue_item)

        with patch("app.services.ai_service.ai_service.generate", new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = mock_llm_response

            extraction, status, error = await ai_pipeline.process_queue_item(db, queue_item.id)

            assert status == "success"
            assert extraction is not None
            assert extraction.id is not None
            assert extraction.extracted_data["scheme_name"] == "Test Scheme"
            assert extraction.validation_report["status"] == "valid"

            # Check queue item status updated
            assert queue_item.status == "processed"

            # Clean up
            from app.models.crawler import CrawlExtraction
            await db.delete(extraction)
            await db.delete(queue_item)
            await db.commit()
            break
