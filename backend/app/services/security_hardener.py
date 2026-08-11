import logging
import socket
import urllib.parse
import ipaddress
import html
from typing import Set

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

            host_lower = host.lower()

            # 3. Direct IP address check (Block loopback & private IPs)
            try:
                ip = ipaddress.ip_address(host_lower)
                if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved:
                    logger.warning(f"SSRF Blocked: Unsafe IP address '{host}' for URL: {url}")
                    return False
                # Direct IP addresses that are not trusted domain names should be blocked
                return False
            except ValueError:
                # Host is a hostname string, not a raw IP
                if host_lower == "localhost" or host_lower.endswith(".local") or host_lower.endswith(".internal"):
                    logger.warning(f"SSRF Blocked: Loopback/Internal hostname '{host}' for URL: {url}")
                    return False

            # 4. Domain suffix check for non-IP hosts
            if not any(host_lower.endswith(suffix) for suffix in ALLOWED_DOMAINS):
                logger.warning(f"SSRF Blocked: Untrusted domain host '{host}' for URL: {url}")
                return False

            # 5. DNS resolve check (SSRF prevention for public domains resolving to private IPs)
            try:
                ips = socket.getaddrinfo(host, None)
                for family, _, _, _, sockaddr in ips:
                    ip_str = sockaddr[0]
                    resolved_ip = ipaddress.ip_address(ip_str)

                    if (
                        resolved_ip.is_loopback or
                        resolved_ip.is_private or
                        resolved_ip.is_link_local
                    ):
                        logger.warning(f"SSRF Blocked: Resolved host {host} to private/unsafe IP {ip_str}")
                        return False
            except Exception:
                pass

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
