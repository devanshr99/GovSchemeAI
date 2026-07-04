"""
Crawl Quality & Filtering Engine (Phase 4.5).
Processes raw scraped web pages, runs filtering checks, generates quality scores,
detects language, classifies page categories, and writes eligible items to the crawl queue database.
"""

import re
import hashlib
import logging
from typing import Optional, Tuple, Dict, Any
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.crawler import CrawlQueueItem

logger = logging.getLogger("yojana.crawler.quality")


class CrawlQualityEngine:
    """
    Evaluates web page quality, filters noise, classifies types,
    and manages the crawl queue database writes.
    """

    # Static file extensions to reject
    BLOCKED_EXTENSIONS = re.compile(
        r"\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|mp3|wav|pdf|docx|zip|tar|gz|css|js|xml|json)$",
        re.IGNORECASE
    )

    # Keyword patterns for Captchas, Login forms, and Search interfaces
    CAPTCHA_PATTERNS = [
        r"captcha", r"recaptcha", r"robot check", r"security check", r"human verification"
    ]
    LOGIN_PATTERNS = [
        r"login", r"sign in", r"username", r"password", r"register", r"signup", r"credentials"
    ]
    SEARCH_PATTERNS = [
        r"search results", r"query=", r"\?q=", r"search_query", r"search\?s="
    ]

    def clean_html(self, raw_html: str) -> str:
        """Removes script, style, navigation, header, and footer tags, returning clean text."""
        if not raw_html:
            return ""

        soup = BeautifulSoup(raw_html, "lxml")

        # Decompose non-content structural elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside", "noscript"]):
            element.decompose()

        # Retrieve text with a spacing delimiter
        text = soup.get_text(separator=" ")
        # Clean up whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def should_reject(
        self,
        url: str,
        raw_html: str,
        clean_text: str,
        headers: Dict[str, str],
        http_status: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Determines whether a page should be rejected based on HTTP codes, URL structures, or text patterns.
        """
        # 1. Check HTTP Status
        if http_status != 200:
            return True, f"HTTP Error Status {http_status}"

        # 2. Check Static Files / Blocked Extensions in URL
        if self.BLOCKED_EXTENSIONS.search(url):
            return True, "Blocked static file extension"

        # 3. Check Mime Type in Headers if present
        if headers:
            content_type = headers.get("Content-Type", "").lower()
            if "text/html" not in content_type:
                return True, f"Unsupported Mime Type: {content_type}"

        # 4. Check Empty Pages
        if not clean_text or len(clean_text) < 100:
            return True, "Empty content or too short (< 100 characters)"

        clean_text_lower = clean_text.lower()

        # 5. Check Captchas
        for pattern in self.CAPTCHA_PATTERNS:
            if re.search(pattern, clean_text_lower):
                return True, f"Blocked Captcha Pattern matching '{pattern}'"

        # 6. Check Logins (specifically password field inputs/buttons)
        for pattern in self.LOGIN_PATTERNS:
            # We look for form labels or descriptors
            if "password" in clean_text_lower and re.search(pattern, clean_text_lower):
                return True, "Blocked Login / Authentication Interface"

        # 7. Check Search Pages
        if "/search" in url or "?q=" in url:
            return True, "Blocked Search Page URL parameters"
        for pattern in self.SEARCH_PATTERNS:
            if re.search(pattern, clean_text_lower):
                return True, "Blocked Search query results pattern"

        return False, None

    def calculate_quality_score(self, url: str, raw_html: str, clean_text: str) -> int:
        """
        Calculates a quality score from 0 to 100 based on metadata rules:
        - Gov Domain: +20
        - Content Length: Up to +30
        - Structural HTML elements: Up to +15
        - Clean text density vs HTML size: Up to +15
        - Low navigation density (Boilerplate check): Up to +15
        - Confident Language presence: +5
        """
        score = 0
        clean_len = len(clean_text)
        raw_len = len(raw_html) if raw_html else 1

        # Heuristic 1: Gov Domain (+20)
        url_lower = url.lower()
        if url_lower.endswith(".gov.in") or ".gov.in/" in url_lower or url_lower.endswith(".nic.in") or ".nic.in/" in url_lower:
            score += 20

        # Heuristic 2: Content Length (Up to 30)
        if clean_len >= 2000:
            score += 30
        elif clean_len >= 1000:
            score += 20
        elif clean_len >= 500:
            score += 10

        # Heuristic 3: Structural HTML tags presence (+15)
        soup = BeautifulSoup(raw_html, "lxml")
        structural_tags = soup.find_all(["h1", "h2", "h3", "p", "table", "ul", "ol"])
        if len(structural_tags) >= 5:
            score += 15
        elif len(structural_tags) >= 2:
            score += 5

        # Heuristic 4: Text Density Ratio (Up to 15)
        # We look for clean text to raw HTML ratio. If too low, it's code-heavy. If too high, it lacks markup context.
        # Ideal range: 10% to 50%
        ratio = clean_len / raw_len
        if 0.10 <= ratio <= 0.50:
            score += 15
        elif 0.05 <= ratio < 0.10 or 0.50 < ratio <= 0.70:
            score += 5

        # Heuristic 5: Navigation Boilerplate Density (Up to 15)
        # Count links inside HTML. If page has too many links compared to total text, it is likely a directory page rather than a content page.
        link_text_len = sum(len(a.get_text()) for a in soup.find_all("a"))
        if clean_len > 0:
            nav_ratio = link_text_len / clean_len
            if nav_ratio < 0.25:  # High content ratio
                score += 15
            elif nav_ratio < 0.50:
                score += 8
        else:
            nav_ratio = 1.0

        # Heuristic 6: Language Check (+10)
        lang = self.detect_language(clean_text)
        if lang in ("en", "hi", "bilingual"):
            score += 10

        return min(score, 100)

    def detect_language(self, text: str) -> str:
        """
        Detects page language using Unicode range heuristic rules:
        - Devanagari range \\u0900-\\u097F denotes Hindi.
        - ASCII words denote English.
        """
        if not text:
            return "unknown"

        # Regex for Devanagari Unicode character range
        devanagari_count = len(re.findall(r"[\u0900-\u097F]", text))
        total_len = len(text)

        # Ratio of Devanagari characters
        dev_ratio = devanagari_count / total_len if total_len > 0 else 0

        # Heuristics
        if dev_ratio > 0.15:
            # Check if there are also significant English sentences
            if re.search(r"[a-zA-Z]{4,}\s+[a-zA-Z]{4,}", text):
                return "bilingual"
            return "hi"
        elif dev_ratio > 0.02:
            return "bilingual"

        # Fallback to English check
        if re.search(r"[a-zA-Z]", text):
            return "en"

        return "unknown"

    def classify_page(self, url: str, text: str) -> str:
        """Classifies page category based on structural tags and URL/Text keywords."""
        url_lower = url.lower()
        text_lower = text.lower()

        # Heuristics based on keywords
        if "/scheme" in url_lower or "yojana" in url_lower or "eligibility" in text_lower or "apply online" in text_lower or "nodal department" in text_lower:
            return "Scheme Page"
        if "press release" in text_lower or "pib.gov.in" in url_lower or "press statement" in text_lower:
            return "Press Release"
        if "circular" in text_lower or "office memorandum" in text_lower or "circular no" in text_lower:
            return "Circular"
        if "notification" in text_lower or "notification no" in text_lower or "gazette" in text_lower:
            return "Notification"
        if "guideline" in text_lower or "manual" in text_lower or "guidelines" in text_lower:
            return "Guideline"
        if "/news" in url_lower or "latest news" in text_lower or "headline" in text_lower:
            return "News Page"
        if url_lower.endswith(".gov.in") or url_lower.endswith(".gov.in/") or url_lower.endswith(".nic.in") or url_lower.endswith(".nic.in/"):
            return "Homepage"
        if "/category" in url_lower or "/directories" in url_lower:
            return "Category Page"
        if ".pdf" in url_lower:
            return "Document"

        return "Unknown"

    async def process_page(
        self,
        db: AsyncSession,
        url: str,
        raw_html: str,
        headers: Dict[str, str] = None,
        http_status: int = 200,
        response_time: Optional[float] = None,
        score_threshold: int = 40,
        allow_pdf: bool = False
    ) -> Tuple[Optional[CrawlQueueItem], str, Optional[str]]:
        """
        Main entry point for incoming scraped page payloads.
        Executes cleanups, duplicate checks, filtering, scoring, classification, and language checks.
        Writes accepted pages to crawl queue.
        Returns: Tuple[CrawlQueueItem or None, Status ('accepted'/'rejected'), Reason/Score info]
        """
        # 1. Clean HTML
        clean_text = self.clean_html(raw_html)

        # 2. Check general rejection filters
        headers = headers or {}
        rejected, reason = self.should_reject(url, raw_html, clean_text, headers, http_status)
        if rejected:
            logger.info(f"[REJECTED] URL: {url} | Reason: {reason}")
            return None, "rejected", reason

        # Extra PDF check if not specifically configured
        if ".pdf" in url.lower() and not allow_pdf:
            logger.info(f"[REJECTED] URL: {url} | Reason: PDF files are disabled")
            return None, "rejected", "PDF files are disabled"

        # 3. Duplicate checks by Content Hash
        content_hash = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()
        dup_stmt = select(CrawlQueueItem).where(CrawlQueueItem.content_hash == content_hash)
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            logger.info(f"[REJECTED] URL: {url} | Reason: Duplicate content hash")
            return None, "rejected", "Duplicate content hash"

        # 4. Generate metadata metrics
        score = self.calculate_quality_score(url, raw_html, clean_text)
        lang = self.detect_language(clean_text)
        category = self.classify_page(url, clean_text)

        # Check score threshold
        if score < score_threshold:
            reject_reason = f"Quality score {score} falls below threshold {score_threshold}"
            logger.info(f"[REJECTED] URL: {url} | Reason: {reject_reason}")
            return None, "rejected", reject_reason

        # 5. Accept page to DB Queue
        metadata_payload = {
            "headers": headers,
            "response_time": response_time,
            "http_status": http_status,
            "length": len(clean_text)
        }

        queue_item = CrawlQueueItem(
            url=url,
            content_hash=content_hash,
            category=category,
            language=lang,
            quality_score=score,
            clean_text=clean_text,
            status="queued",
            metadata_=metadata_payload
        )

        db.add(queue_item)
        await db.commit()
        await db.refresh(queue_item)

        logger.info(
            f"[ACCEPTED] URL: {url} | Score: {score} | Language: {lang} | Classification: {category}"
        )
        return queue_item, "accepted", f"Score: {score}"


# Singleton
quality_engine = CrawlQualityEngine()
