"""
India.gov.in Gazette Scraper
Fetches scheme details from the National Portal of India (india.gov.in).
Uses BeautifulSoup4 to scrape the HTML government schemes directory pages.
"""

import logging
import httpx
from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper, RawSchemeData

logger = logging.getLogger("yojana.scrapers.gazette")


class GazetteScraper(BaseScraper):
    """
    HTML scraper for the National Portal of India (india.gov.in/my-government/schemes).
    Parses scheme catalogs, ministries, and URLs.
    """

    BASE_URL = "https://www.india.gov.in/my-government/schemes"

    @property
    def source_name(self) -> str:
        return "gazette_india_gov"

    async def health_check(self, client: httpx.AsyncClient) -> bool:
        """Check if national portal is accessible."""
        try:
            resp = await client.get(self.BASE_URL)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"India.gov.in health check failed: {e}")
            return False

    async def fetch_schemes(self, client: httpx.AsyncClient) -> list[RawSchemeData]:
        """
        Scrape scheme listings from the national portal.
        Paginates through pages of the HTML list.
        """
        all_schemes: list[RawSchemeData] = []
        max_pages = 5  # Fetch top 5 pages to avoid overloading or getting blocked

        for page in range(0, max_pages):
            try:
                url = self.BASE_URL
                if page > 0:
                    url = f"{self.BASE_URL}?page={page}"

                resp = await client.get(url)
                resp.raise_for_status()

                schemes = self._parse_html(resp.text)
                if not schemes:
                    break

                all_schemes.extend(schemes)
                logger.info(f"Gazette page {page + 1}: found {len(schemes)} schemes")

                await self.rate_limit_pause()

            except Exception as e:
                logger.error(f"Gazette fetch error at page {page}: {e}")
                break

        logger.info(f"Gazette: fetched {len(all_schemes)} total schemes")
        return all_schemes

    def _parse_html(self, html_content: str) -> list[RawSchemeData]:
        """Parse India.gov.in schemes listing page."""
        schemes = []
        soup = BeautifulSoup(html_content, "lxml")

        # Select individual scheme listing cards/divs
        # On india.gov.in, search/directory listings typically have views-row classes or view-content
        items = soup.select(".views-row") or soup.select(".view-content .views-row")
        if not items:
            # Fallback to general list items if layout differs
            items = soup.select(".content .views-row")

        for item in items:
            try:
                # 1. Scheme Title & URL
                title_tag = item.select_one("h3 a") or item.select_one(".views-field-title a")
                if not title_tag:
                    continue

                name = title_tag.text.strip()
                source_url = title_tag.get("href", "")
                if source_url and not source_url.startswith("http"):
                    source_url = f"https://www.india.gov.in{source_url}"

                # 2. Scheme Description
                desc_tag = item.select_one(".views-field-body") or item.select_one(".description")
                description = desc_tag.text.strip() if desc_tag else ""

                # 3. Ministry
                ministry_tag = item.select_one(".views-field-field-ministry") or item.select_one(".ministry")
                ministry = ministry_tag.text.strip() if ministry_tag else ""
                # Clean up prefix e.g., "Ministry: Ministry of Agriculture"
                if ":" in ministry:
                    ministry = ministry.split(":", 1)[1].strip()

                if not name or len(name) < 3:
                    continue

                # Generate a unique source id from the URL slug or title
                source_id = source_url.split("/")[-1] if source_url else str(hash(name))

                raw_scheme = RawSchemeData(
                    source_name=self.source_name,
                    source_id=source_id,
                    source_url=source_url,
                    name=name,
                    ministry=ministry,
                    description=description,
                    level="central",  # India.gov.in focuses mostly on central registry
                    scheme_type=["central"],
                    raw_payload={
                        "html_snippet": str(item),
                        "extracted_url": source_url
                    }
                )
                schemes.append(raw_scheme)

            except Exception as e:
                logger.warning(f"Error parsing Gazette list item: {e}")
                continue

        return schemes
