"""
MyScheme.gov.in Scraper
Primary source for government schemes — largest structured dataset.
Uses the public API at api.myscheme.gov.in.
"""

import logging
import httpx

from app.scrapers.base import BaseScraper, RawSchemeData

logger = logging.getLogger("yojana.scrapers.myscheme")


class MySchemeScraper(BaseScraper):
    """
    Scrapes scheme data from the MyScheme.gov.in public API.
    This is the Indian government's official scheme discovery portal.
    """

    BASE_URL = "https://api.myscheme.gov.in"

    @property
    def source_name(self) -> str:
        return "myscheme_gov"

    async def health_check(self, client: httpx.AsyncClient) -> bool:
        """Check MyScheme API is reachable."""
        try:
            resp = await client.get(
                f"{self.BASE_URL}/search/schemes",
                params={"lang": "en", "limit": 1, "skip": 0},
            )
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"MyScheme health check failed: {e}")
            return False

    async def fetch_schemes(self, client: httpx.AsyncClient) -> list[RawSchemeData]:
        """
        Fetch schemes from MyScheme API with pagination.
        The API supports /search/schemes with skip/limit pagination.
        """
        all_schemes: list[RawSchemeData] = []
        page_size = 25
        skip = 0
        max_pages = 40  # Safety cap: 40 * 25 = 1000 schemes max

        for page_num in range(max_pages):
            try:
                resp = await client.get(
                    f"{self.BASE_URL}/search/schemes",
                    params={
                        "lang": "en",
                        "limit": page_size,
                        "skip": skip,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                # The response structure: { "data": [...], "totalCount": N }
                schemes_data = data.get("data", [])
                total_count = data.get("totalCount", 0)

                if not schemes_data:
                    break

                for item in schemes_data:
                    try:
                        scheme = self._parse_scheme(item)
                        if scheme:
                            all_schemes.append(scheme)
                    except Exception as e:
                        logger.warning(f"Failed to parse MyScheme item: {e}")
                        continue

                skip += page_size
                if skip >= total_count:
                    break

                await self.rate_limit_pause()

            except httpx.HTTPStatusError as e:
                logger.error(f"MyScheme API HTTP error at page {page_num}: {e}")
                break
            except Exception as e:
                logger.error(f"MyScheme fetch error at page {page_num}: {e}")
                break

        logger.info(f"MyScheme: fetched {len(all_schemes)} total schemes")
        return all_schemes

    def _parse_scheme(self, item: dict) -> RawSchemeData | None:
        """Parse a single scheme from the MyScheme API response."""
        scheme_name = (item.get("schemeName") or item.get("name") or "").strip()
        if not scheme_name:
            return None

        # Extract ministry/department
        ministry = (item.get("ministryName") or item.get("nodalMinistryName") or "").strip()
        department = (item.get("departmentName") or item.get("nodalDepartmentName") or "").strip()

        # Extract level
        level = "central"
        scheme_level = (item.get("level") or "").lower()
        if "state" in scheme_level:
            level = "state"
        elif "district" in scheme_level:
            level = "district"

        # Extract state
        state = ""
        state_info = item.get("state") or item.get("stateName") or ""
        if isinstance(state_info, str):
            state = state_info.strip()

        # Build description from multiple fields
        description = (item.get("briefDescription") or item.get("schemeDescription") or "").strip()

        # Benefits
        benefits = (item.get("benefits") or item.get("benefitsProvided") or "").strip()
        benefits_amount = (item.get("schemeAmount") or item.get("amount") or "").strip()

        # Eligibility text
        eligibility_text = (item.get("eligibility") or item.get("eligibilityCriteria") or "").strip()

        # Documents
        docs_raw = item.get("documents") or item.get("documentsRequired") or []
        if isinstance(docs_raw, str):
            required_documents = [d.strip() for d in docs_raw.split(",") if d.strip()]
        elif isinstance(docs_raw, list):
            required_documents = [str(d).strip() for d in docs_raw if d]
        else:
            required_documents = []

        # Application process
        application_process = (item.get("applicationProcess") or item.get("howToApply") or "").strip()
        application_url = (item.get("applicationUrl") or item.get("schemeUrl") or "").strip()

        # Category / tags
        tags = []
        categories_raw = item.get("categories") or item.get("tags") or []
        if isinstance(categories_raw, list):
            tags = [str(t).strip() for t in categories_raw if t]
        category_hint = tags[0] if tags else ""

        # Source ID
        source_id = str(item.get("id") or item.get("schemeId") or item.get("_id") or "")

        return RawSchemeData(
            source_name=self.source_name,
            source_id=source_id,
            source_url=f"https://www.myscheme.gov.in/schemes/{source_id}" if source_id else "",
            name=scheme_name,
            name_hi=item.get("schemeNameHi", ""),
            ministry=ministry,
            department=department,
            level=level,
            state=state,
            description=description,
            benefits=benefits,
            benefits_amount=benefits_amount,
            eligibility_text=eligibility_text,
            required_documents=required_documents,
            application_process=application_process,
            application_url=application_url,
            official_website=item.get("officialUrl", ""),
            helpline=item.get("helpline", ""),
            scheme_type=[level] if level else [],
            tags=tags,
            category_hint=category_hint,
            raw_payload=item,
        )
