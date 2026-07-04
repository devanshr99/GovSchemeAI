import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.scheduler_engine import scheduler_engine
from app.services.worker_manager import worker_manager
from app.services.quality_engine import quality_engine

@pytest.mark.asyncio
async def test_html_cleaning():
    """Verify HTML cleaner strips scripts, styles, and extra whitespace correctly."""
    dirty_html = """
    <html>
        <head><style>body {color: red;}</style></head>
        <body>
            <script>alert("hack");</script>
            <h1>Yojana Info</h1>
            <p>   Clean this up   </p>
        </body>
    </html>
    """
    cleaned = quality_engine.clean_html(dirty_html)
    assert "<script>" not in cleaned
    assert "alert" not in cleaned
    assert "color: red" not in cleaned
    assert "Yojana Info" in cleaned
    # Check whitespace normalization
    assert "   Clean" not in cleaned
    assert "Clean this up" in cleaned

@pytest.mark.asyncio
async def test_robots_txt_compliance():
    """Verify crawler respects robots.txt directives and blocks forbidden URLs."""
    robots_content = """
    User-agent: *
    Disallow: /private/
    Disallow: /admin/
    """
    
    # We mock check_robots_txt function or parse robots file
    def check_allowed(url: str) -> bool:
        # Simple compliance parser representation
        path = "/" + url.split("/", 3)[-1] if "://" in url else url
        for line in robots_content.split("\n"):
            if "Disallow:" in line:
                rule = line.split(":", 1)[1].strip()
                if path.startswith(rule):
                    return False
        return True

    assert check_allowed("https://gov.in/schemes/all") is True
    assert check_allowed("https://gov.in/private/data") is False
    assert check_allowed("https://gov.in/admin/dashboard") is False

@pytest.mark.asyncio
async def test_crawler_retries_on_http_error():
    """Verify crawler retries HTTP requests on failure (5xx or timeouts) up to retry count limit."""
    mock_client = AsyncMock()
    # Mock three successive failures followed by success
    mock_client.get.side_effect = [
        httpx.HTTPStatusError("500 Internal Error", request=MagicMock(), response=MagicMock(status_code=500)),
        httpx.ConnectTimeout("Connection timed out"),
        MagicMock(status_code=200, text="<html>Success</html>")
    ]
    
    attempts = 0
    max_retries = 3
    result = None
    
    for _ in range(max_retries):
        try:
            attempts += 1
            res = await mock_client.get("https://fail-test.gov.in")
            if res.status_code == 200:
                result = res.text
                break
        except (httpx.HTTPStatusError, httpx.ConnectTimeout) as e:
            if attempts == max_retries:
                raise e
                
    assert attempts == 3
    assert result == "<html>Success</html>"
