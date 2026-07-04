"""
AI Service — LLM provider abstraction layer.
Supports Gemini, Claude, OpenAI with automatic fallback.
"""

import logging
import json
from abc import ABC, abstractmethod
from typing import Optional
import httpx

from app.config import get_settings

logger = logging.getLogger("yojana.ai")
settings = get_settings()


class AIProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        pass

    @abstractmethod
    async def check_availability(self) -> bool:
        pass


class GeminiProvider(AIProvider):
    """Google Gemini via REST API."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        if not self.api_key:
            raise RuntimeError("Gemini API key not configured")

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.3,
            },
        }

        resp = await self.client.post(url, json=payload, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()

        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
        return ""

    async def check_availability(self) -> bool:
        return bool(self.api_key)


class ClaudeProvider(AIProvider):
    """Anthropic Claude via Messages API."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.api_key = settings.anthropic_api_key
        self.model = settings.claude_model

    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        if not self.api_key:
            raise RuntimeError("Anthropic API key not configured")

        resp = await self.client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": self.model,
                "max_tokens": max_tokens,
                "system": system_prompt or "You are a helpful assistant.",
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        content = data.get("content", [])
        if content:
            return content[0].get("text", "")
        return ""

    async def check_availability(self) -> bool:
        return bool(self.api_key)


class OpenAIProvider(AIProvider):
    """OpenAI Chat Completions API."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model

    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        if not self.api_key:
            raise RuntimeError("OpenAI API key not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        resp = await self.client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.3,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return ""

    async def check_availability(self) -> bool:
        return bool(self.api_key)


class FallbackProvider(AIProvider):
    """No-LLM fallback. Returns a template-based response."""

    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        return (
            "AI explanation is currently unavailable. "
            "Please check the scheme details and eligibility criteria listed above. "
            "For assistance, contact the helpline number provided."
        )

    async def check_availability(self) -> bool:
        return True


class OpenRouterProvider(AIProvider):
    """OpenRouter — supports Gemini 2.5, DeepSeek, GPT-4o via one API."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model

    async def generate(
        self, prompt: str, system_prompt: str = "", max_tokens: int = 1024
    ) -> str:
        if not self.api_key:
            raise RuntimeError("OpenRouter API key not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        resp = await self.client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "GovSchemeAI - Government Schemes",
            },
            json={
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.4,
            },
            timeout=45.0,
        )
        resp.raise_for_status()
        data = resp.json()

        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return ""

    async def check_availability(self) -> bool:
        return bool(self.api_key)


class AIService:
    """
    Unified AI service. Picks the configured primary provider,
    falls back through the chain if primary is unavailable.
    """

    def __init__(self):
        # Initialize connection pooled HTTP client for reusing TCP connections across LLM requests
        self.client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
            timeout=httpx.Timeout(45.0, connect=10.0)
        )
        self.providers = {
            "openrouter": OpenRouterProvider(self.client),
            "gemini": GeminiProvider(self.client),
            "anthropic": ClaudeProvider(self.client),
            "openai": OpenAIProvider(self.client),
            "fallback": FallbackProvider(),
        }
        self.primary = settings.primary_ai_provider

    async def close(self):
        """Close HTTP client connection pool on application shutdown."""
        await self.client.aclose()

    def _get_provider(self) -> AIProvider:
        provider = self.providers.get(self.primary)
        if provider:
            return provider
        return self.providers["fallback"]

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        max_tokens: int = 1024,
    ) -> str:
        """Generate text using configured AI provider with fallback chain."""
        # Try primary first
        provider = self._get_provider()
        try:
            if await provider.check_availability():
                return await provider.generate(prompt, system_prompt, max_tokens)
        except Exception as e:
            logger.warning(f"Primary provider ({self.primary}) failed: {e}")

        # Try remaining providers
        for name, prov in self.providers.items():
            if name == self.primary or name == "fallback":
                continue
            try:
                if await prov.check_availability():
                    logger.info(f"Falling back to {name}")
                    return await prov.generate(prompt, system_prompt, max_tokens)
            except Exception as e:
                logger.warning(f"Fallback provider ({name}) failed: {e}")

        # Last resort
        return await self.providers["fallback"].generate(prompt, system_prompt, max_tokens)

    async def explain_eligibility(
        self,
        scheme_name: str,
        scheme_benefits: str,
        eligibility_rules: list[str],
        user_profile_summary: str,
        match_score: float,
        language: str = "en",
    ) -> str:
        """Generate AI explanation for why a user qualifies for a scheme."""
        lang_instruction = (
            "Respond in Hindi (Devanagari script)." if language == "hi"
            else "Respond in simple English."
        )

        system_prompt = f"""You are GovSchemeAI, an expert on Indian government schemes.
{lang_instruction}
Be concise, accurate, and helpful. Use simple language that a rural Indian citizen can understand.
Never fabricate scheme details. Only explain based on the information provided."""

        prompt = f"""Explain why this person is eligible for the following government scheme.

**User Profile**: {user_profile_summary}
**Match Score**: {match_score * 100:.0f}%

**Scheme**: {scheme_name}
**Benefits**: {scheme_benefits}
**Eligibility Criteria**: {'; '.join(eligibility_rules)}

Provide:
1. A 2-3 sentence explanation of why they qualify
2. Key benefits they'll receive
3. One specific next step to apply

Keep it under 150 words."""

        return await self.generate(prompt, system_prompt, max_tokens=300)

    async def chat_response(
        self,
        user_message: str,
        context: str = "",
        chat_history: list[dict] = None,
        language: str = "en",
    ) -> str:
        """Generate a conversational response about government schemes."""
        lang_instruction = (
            "Respond in Hindi (Devanagari script)." if language == "hi"
            else "Respond in simple English."
        )

        system_prompt = f"""You are GovSchemeAI, a friendly AI assistant that helps Indian citizens
discover and understand government schemes they're eligible for.
{lang_instruction}
Be accurate. If you're not sure about a scheme detail, say so.
Never make up scheme names, amounts, or eligibility criteria.
Suggest users verify details on official government websites."""

        # Build context
        parts = []
        if context:
            parts.append(f"Reference information:\n{context}")
        if chat_history:
            history_text = "\n".join(
                [f"{m['role']}: {m['content']}" for m in chat_history[-6:]]
            )
            parts.append(f"Previous conversation:\n{history_text}")
        parts.append(f"User: {user_message}")

        prompt = "\n\n".join(parts)
        return await self.generate(prompt, system_prompt, max_tokens=500)


# Singleton
ai_service = AIService()
