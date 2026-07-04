"""
data.gov.in Scraper
Fetches government scheme datasets from the Open Government Data Platform India.
Uses the public API with OGDP resource IDs for scheme-related datasets.
"""

import logging
import httpx

from app.scrapers.base import BaseScraper, RawSchemeData

logger = logging.getLogger("yojana.scrapers.datagov")


class DataGovScraper(BaseScraper):
    """
    Scrapes scheme data from api.data.gov.in.
    Targets specific government scheme catalog datasets.
    """

    BASE_URL = "https://api.data.gov.in/resource"

    # Known dataset resource IDs for government scheme listings
    # These are stable government-published dataset identifiers
    RESOURCE_IDS = [
        "08ada896-b498-4404-9a2b-c6104c2e5b3c",  # Central Sector Schemes
    ]

    @property
    def source_name(self) -> str:
        return "data_gov_in"

    async def health_check(self, client: httpx.AsyncClient) -> bool:
        """Check data.gov.in API is reachable."""
        try:
            resp = await client.get(
                f"{self.BASE_URL}/{self.RESOURCE_IDS[0]}",
                params={"api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b", "format": "json", "limit": 1},
            )
            return resp.status_code in (200, 403)  # 403 = key issue but API is up
        except Exception as e:
            logger.warning(f"data.gov.in health check failed: {e}")
            return False

    async def fetch_schemes(self, client: httpx.AsyncClient) -> list[RawSchemeData]:
        """
        Fetch schemes from data.gov.in API.
        Iterates over known resource IDs and paginates each.
        """
        all_schemes: list[RawSchemeData] = []

        for resource_id in self.RESOURCE_IDS:
            try:
                schemes = await self._fetch_resource(client, resource_id)
                all_schemes.extend(schemes)
                await self.rate_limit_pause()
            except Exception as e:
                logger.error(f"data.gov.in resource {resource_id} failed: {e}")
                continue

        logger.info(f"data.gov.in: fetched {len(all_schemes)} total schemes")
        return all_schemes

    async def _fetch_resource(
        self, client: httpx.AsyncClient, resource_id: str
    ) -> list[RawSchemeData]:
        """Fetch all records from a single data.gov.in resource."""
        schemes: list[RawSchemeData] = []
        offset = 0
        page_size = 100
        max_pages = 10  # Safety cap

        for page_num in range(max_pages):
            try:
                resp = await client.get(
                    f"{self.BASE_URL}/{resource_id}",
                    params={
                        "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
                        "format": "json",
                        "limit": page_size,
                        "offset": offset,
                    },
                )

                if resp.status_code == 403:
                    logger.warning(f"data.gov.in: API key issue for resource {resource_id}")
                    break

                resp.raise_for_status()
                data = resp.json()

                records = data.get("records", [])
                if not records:
                    break

                for record in records:
                    try:
                        scheme = self._parse_record(record, resource_id)
                        if scheme:
                            schemes.append(scheme)
                    except Exception as e:
                        logger.warning(f"Failed to parse data.gov.in record: {e}")
                        continue

                total = data.get("total", 0)
                offset += page_size
                if offset >= total:
                    break

                await self.rate_limit_pause()

            except httpx.HTTPStatusError as e:
                logger.error(f"data.gov.in HTTP error: {e}")
                break
            except Exception as e:
                logger.error(f"data.gov.in fetch error: {e}")
                break

        return schemes

    def _parse_record(self, record: dict, resource_id: str) -> RawSchemeData | None:
        """Parse a single record from data.gov.in dataset."""
        # Data.gov.in records have varying field names depending on the dataset
        name = (
            record.get("scheme_name")
            or record.get("name_of_the_scheme")
            or record.get("scheme")
            or record.get("title")
            or ""
        ).strip()

        if not name or len(name) < 3:
            return None

        ministry = (
            record.get("ministry")
            or record.get("ministry_department")
            or record.get("nodal_ministry")
            or ""
        ).strip()

        description = (
            record.get("objective")
            or record.get("description")
            or record.get("brief_description")
            or ""
        ).strip()

        benefits = (
            record.get("benefits")
            or record.get("assistance_provided")
            or ""
        ).strip()

        eligibility = (
            record.get("eligibility")
            or record.get("target_beneficiaries")
            or record.get("eligible_beneficiaries")
            or ""
        ).strip()

        # Generate a source ID from the record
        source_id = str(record.get("s_no_") or record.get("sr_no") or record.get("id") or hash(name))

        return RawSchemeData(
            source_name=self.source_name,
            source_id=f"{resource_id}_{source_id}",
            source_url=f"https://data.gov.in/resource/{resource_id}",
            name=name,
            ministry=ministry,
            description=description,
            benefits=benefits,
            eligibility_text=eligibility,
            level="central",  # data.gov.in datasets are typically central schemes
            scheme_type=["central"],
            tags=[],
            category_hint=ministry.lower() if ministry else "",
            raw_payload=record,
        )
