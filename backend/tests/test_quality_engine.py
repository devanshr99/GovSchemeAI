"""
Unit tests for Crawl Quality & Filtering Engine (Phase 4.5).
"""

import pytest
from app.services.quality_engine import quality_engine
from app.database import get_db, init_db


def test_html_cleansing():
    """Verify script, style, and structure tags are cleaned correctly."""
    raw_html = """
    <html>
      <head>
        <style>body { color: red; }</style>
        <script>console.log("noisy script");</script>
      </head>
      <body>
        <header><nav><a href="/">Home</a></nav></header>
        <main>
          <h1>Pradhan Mantri Scheme</h1>
          <p>This is a real government scheme text contents.</p>
        </main>
        <footer>© 2026 Government</footer>
      </body>
    </html>
    """
    clean_text = quality_engine.clean_html(raw_html)
    assert "noisy script" not in clean_text
    assert "color: red" not in clean_text
    assert "Home" not in clean_text  # Nav tag stripped
    assert "Government" not in clean_text  # Footer tag stripped
    assert "Pradhan Mantri Scheme" in clean_text
    assert "real government scheme" in clean_text


def test_should_reject_filtering():
    """Verify engine correctly filters non-HTML, logins, empty pages, search, captchas."""
    # 1. Invalid status
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", "html", {}, 404)
    assert rejected is True
    assert "HTTP Error" in reason

    # 2. Blocked extensions
    rejected, reason = quality_engine.should_reject("https://a.gov.in/doc.zip", "html", "html", {}, 200)
    assert rejected is True
    assert "Blocked static file" in reason

    # 3. Blocked Mime type
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", "html", {"Content-Type": "application/pdf"}, 200)
    assert rejected is True
    assert "Unsupported Mime Type" in reason

    # 4. Too short
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", "too short", {}, 200)
    assert rejected is True
    assert "too short" in reason

    # 5. Captcha page
    long_captcha_text = "This page contains security verification robot check recaptcha " + ("A" * 100)
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", long_captcha_text, {}, 200)
    assert rejected is True
    assert "Captcha" in reason

    # 6. Login page
    long_login_text = "Please enter your username and password to sign in " + ("A" * 100)
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", long_login_text, {}, 200)
    assert rejected is True
    assert "Login" in reason

    # 7. Search result page
    long_search_text = "Search results match queries for text matching " + ("A" * 100)
    rejected, reason = quality_engine.should_reject("https://a.gov.in", "html", long_search_text, {}, 200)
    assert rejected is True
    assert "Search" in reason


def test_quality_scoring_heuristics():
    """Verify that quality score is calculated properly based on length, domain, tags."""
    # 1. Non-gov short page
    score_low = quality_engine.calculate_quality_score(
        "https://randomsite.com/page",
        "<html><p>Very short text snippet for scoring check.</p></html>",
        "Very short text snippet for scoring check."
    )
    assert score_low < 40

    # 2. Gov domain, rich content, structural tags page
    long_content = "This is a rich government scheme page. " * 50
    html_page = "<html><body>" + "<h1>Scheme</h1><p>Text</p>" * 10 + "</body></html>"
    score_high = quality_engine.calculate_quality_score(
        "https://agriculture.gov.in/scheme-yojana",
        html_page,
        long_content
    )
    assert score_high >= 70


def test_language_detection():
    """Verify language detection logic catches English, Hindi, and Bilingual scripts."""
    # English
    assert quality_engine.detect_language("This is a simple English sentence sample.") == "en"

    # Hindi
    assert quality_engine.detect_language("प्रधानमंत्री किसान सम्मान निधि योजना के तहत किसानों को लाभ मिलेगा।") == "hi"

    # Bilingual
    bilingual_text = "This is a bilingual page. प्रधानमंत्री किसान सम्मान निधि योजना के तहत किसानों को लाभ मिलेगा।"
    assert quality_engine.detect_language(bilingual_text) == "bilingual"


def test_page_classification():
    """Verify page intent classification from content keywords."""
    assert quality_engine.classify_page("https://a.gov.in/yojana", "Scheme Eligibility Guidelines") == "Scheme Page"
    assert quality_engine.classify_page("https://pib.gov.in/press-release", "Press Release statement") == "Press Release"
    assert quality_engine.classify_page("https://a.gov.in/circulars", "Office Memorandum circular no 12") == "Circular"
    assert quality_engine.classify_page("https://a.gov.in/gazette", "Notification no 5 published in Gazette") == "Notification"


@pytest.mark.asyncio
async def test_processing_and_queuing():
    """Verify process_page handles cleaning, filters, duplicate check, and DB commit."""
    from app.database import get_db, init_db
    await init_db()

    url = "https://agriculture.gov.in/pm-kisan-yojana-details"
    raw_html = """
    <html>
      <body>
        <h1>PM-KISAN Scheme Benefits</h1>
        <p>This is a long government text to satisfy length guidelines. </p>
        <p>Additional details regarding how farmers can apply online. </p>
        <p>Eligible candidates will receive financial support. </p>
        <p>Documents required: Aadhaar card, bank account. </p>
      </body>
    </html>
    """

    async for db in get_db():
        # Process clean page successfully
        item, status, info = await quality_engine.process_page(
            db, url=url, raw_html=raw_html, http_status=200, score_threshold=30
        )
        assert item is not None
        assert status == "accepted"
        assert item.id is not None
        assert item.category == "Scheme Page"
        assert item.language == "en"

        # Try duplicate submission (should be rejected as duplicate)
        item_dup, status_dup, info_dup = await quality_engine.process_page(
            db, url="https://another-url.gov.in", raw_html=raw_html, http_status=200, score_threshold=30
        )
        assert item_dup is None
        assert status_dup == "rejected"
        assert "Duplicate" in info_dup

        # Clean up database entry
        from app.models.crawler import CrawlQueueItem
        await db.delete(item)
        await db.commit()
        break
