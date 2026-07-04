"""
Scrapers package — automatic government scheme data collection.

Registry pattern: all scrapers self-register here for the orchestrator to discover.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.scrapers.base import BaseScraper


def get_all_scrapers() -> list["BaseScraper"]:
    """
    Returns instances of all registered scrapers.
    Import here to avoid circular dependencies.
    """
    from app.scrapers.myscheme_scraper import MySchemeScraper
    from app.scrapers.datagov_scraper import DataGovScraper
    from app.scrapers.gazette_scraper import GazetteScraper

    return [
        MySchemeScraper(),
        DataGovScraper(),
        GazetteScraper(),
    ]
