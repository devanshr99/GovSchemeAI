import logging
import socket
import urllib.parse
import ipaddress
import html
from typing import Set, List

logger = logging.getLogger("yojana.security")

# Allowed government/trusted top-level domain suffixes
ALLOWED_DOMAINS = [".gov.in", ".nic.in", ".gov", ".org", ".mil"]


class SecurityHardenerService:
    """
    Core security utility providing SSRF URL validations, prompt injection screens,
    output HTML sanitizations, and admin token session invalidations.
    """

    def __init__(self):
        self._blacklisted_tokens: Set[str] = set()

    def is_safe_crawl_url(self, url: str) -> bool:
        """
        Validates URL is clean of local IPs, loopbacks, private networks (SSRF prevention),
        and verifies the target matches trusted government domains.
        """
        try:
            parsed = urllib.parse.urlparse(url)
            # 1. Scheme check
            if parsed.scheme not in ("http", "https"):
                logger.warning(f"SSRF Blocked: Invalid URL scheme '{parsed.scheme}' for URL: {url}")
                return False

            # 2. Host presence check
            host = parsed.hostname
            if not host:
                logger.warning(f"SSRF Blocked: Missing hostname for URL: {url}")
                return False

            # 3. Domain suffix check
            host_lower = host.lower()
            if not any(host_lower.endswith(suffix) for suffix in ALLOWED_DOMAINS):
                # Allow IP hosts for testing if explicitly defined, otherwise block untrusted hosts
                if not host_lower.replace(".", "").isdigit() and "localhost" not in host_lower:
                    logger.warning(f"SSRF Blocked: Untrusted domain host '{host}' for URL: {url}")
                    return False

            # 4. DNS resolve check (SSRF prevention)
            # Resolve domain to IP addresses
            ips = socket.getaddrinfo(host, None)
            for family, _, _, _, sockaddr in ips:
                ip_str = sockaddr[0]
                ip = ipaddress.ip_address(ip_str)

                # Block loopback, link-local, private, multicast, reserved addresses
                if (
                    ip.is_loopback or
                    ip.is_private or
                    ip.is_link_local or
                    ip.is_multicast or
                    ip.is_reserved
                ):
                    logger.warning(f"SSRF Blocked: Resolved host {host} to private/unsafe IP {ip_str}")
                    return False

            return True
        except Exception as e:
            logger.error(f"SSRF Validation Error for URL {url}: {e}")
            return False

    def detect_prompt_injection(self, text: str) -> bool:
        """
        Scans strings for known system commands, jailbreak patterns, or instructions overrides.
        """
        if not text:
            return False

        injection_keywords = [
            "ignore previous instructions",
            "ignore the instructions above",
            "system override",
            "bypass guardrails",
            "you are now a simulator",
            "developer mode",
            "override instructions",
            "forget your instructions"
        ]

        text_lower = text.lower()
        for kw in injection_keywords:
            if kw in text_lower:
                logger.warning(f"AI Prompt Injection Guard Blocked request containing keyword: '{kw}'")
                return True
        return False

    def sanitize_output(self, text: str) -> str:
        """
        Escapes HTML characters to prevent XSS script tag injections in UI outputs.
        """
        if not text:
            return ""
        return html.escape(text)

    # ── Session Token Blacklist (Logout Invalidation) ──

    def blacklist_token(self, token: str):
        """Invalidates the provided authentication token session."""
        if token:
            self._blacklisted_tokens.add(token)
            logger.info("Admin token successfully blacklisted (Session Invalidated).")

    def is_token_blacklisted(self, token: str) -> bool:
        """Checks if token session is blacklisted."""
        return token in self._blacklisted_tokens


# Singleton
security_hardener = SecurityHardenerService()
