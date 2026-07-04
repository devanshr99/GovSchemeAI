"""
Base scraper abstract class.
All data source scrapers inherit from BaseScraper to ensure
consistent interfaces, error handling, rate limiting, and retries.
"""

import logging
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
import httpx

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("govscheme.scrapers")


@dataclass
class RawSchemeData:
    """
    Raw scheme record as scraped from a source.
    All fields are optional — the normalizer handles missing data.
    """
    source_name: str
    source_id: str
    source_url: str = ""

    name: str = ""
    name_hi: str = ""
    ministry: str = ""
    department: str = ""
    level: str = ""  # central, state, district
    state: str = ""

    description: str = ""
    description_hi: str = ""
    benefits: str = ""
    benefits_hi: str = ""
    benefits_amount: str = ""

    eligibility_text: str = ""  # unstructured eligibility description
    required_documents: list[str] = field(default_factory=list)
    application_process: str = ""
    application_url: str = ""
    official_website: str = ""
    helpline: str = ""

    scheme_type: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    category_hint: str = ""  # helps normalizer pick a category

    deadline: Optional[str] = None
    launched_date: Optional[str] = None

    raw_payload: dict = field(default_factory=dict)  # full original response

    def to_dict(self) -> dict:
        """Serialize for JSON storage in staging table."""
        return {
            "source_name": self.source_name,
            "source_id": self.source_id,
            "source_url": self.source_url,
            "name": self.name,
            "name_hi": self.name_hi,
            "ministry": self.ministry,
            "department": self.department,
            "level": self.level,
            "state": self.state,
            "description": self.description,
            "description_hi": self.description_hi,
            "benefits": self.benefits,
            "benefits_hi": self.benefits_hi,
            "benefits_amount": self.benefits_amount,
            "eligibility_text": self.eligibility_text,
            "required_documents": self.required_documents,
            "application_process": self.application_process,
            "application_url": self.application_url,
            "official_website": self.official_website,
            "helpline": self.helpline,
            "scheme_type": self.scheme_type,
            "tags": self.tags,
            "category_hint": self.category_hint,
            "deadline": self.deadline,
            "launched_date": self.launched_date,
        }


class BaseScraper(ABC):
    """
    Abstract base for all government data source scrapers.

    Subclasses implement:
        - source_name: str property
        - fetch_schemes(): the actual scraping logic

    The base class provides:
        - HTTP client with timeout/retries
        - Rate limiting
        - Structured error handling
        - Health check
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier for this source, e.g. 'myscheme_gov'."""
        ...

    @abstractmethod
    async def fetch_schemes(self, client: httpx.AsyncClient) -> list[RawSchemeData]:
        """
        Fetch scheme data from the source.
        Return a list of RawSchemeData objects.
        Should NOT raise — return empty list on failure and log errors.
        """
        ...

    async def health_check(self, client: httpx.AsyncClient) -> bool:
        """
        Check if the data source is reachable.
        Override for custom health checks.
        """
        return True

    async def run(self) -> list[RawSchemeData]:
        """
        Execute the scraper with managed HTTP client, rate limiting, and retries.
        This is the public entry point called by the orchestrator.
        """
        logger.info(f"[{self.source_name}] Starting scrape...")
        results: list[RawSchemeData] = []

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.scraper_timeout, connect=10.0),
            follow_redirects=True,
            headers={
                "User-Agent": "GovSchemeAI/1.0 (Government Scheme Aggregator; +https://govscheme-ai.in)",
                "Accept": "application/json, text/html",
            },
        ) as client:
            # Health check first
            try:
                is_healthy = await self.health_check(client)
                if not is_healthy:
                    logger.warning(f"[{self.source_name}] Health check failed — skipping")
                    return []
            except Exception as e:
                logger.warning(f"[{self.source_name}] Health check error: {e}")
                return []

            # Fetch with retry
            for attempt in range(1, settings.scraper_max_retries + 1):
                try:
                    results = await self.fetch_schemes(client)
                    logger.info(
                        f"[{self.source_name}] Fetched {len(results)} schemes "
                        f"(attempt {attempt})"
                    )
                    break
                except Exception as e:
                    logger.error(
                        f"[{self.source_name}] Attempt {attempt}/{settings.scraper_max_retries} "
                        f"failed: {e}"
                    )
                    if attempt < settings.scraper_max_retries:
                        wait = 2 ** attempt  # exponential backoff
                        logger.info(f"[{self.source_name}] Retrying in {wait}s...")
                        await asyncio.sleep(wait)

        return results

    async def rate_limit_pause(self):
        """Simple rate limiting between requests."""
        delay = 60.0 / max(settings.scraper_rate_limit_per_minute, 1)
        await asyncio.sleep(delay)
