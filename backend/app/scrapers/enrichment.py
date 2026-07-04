"""
AI Enrichment Service
Enriches normalized scheme data using LLMs (via the existing ai_service).
- Generates Hindi translations for missing fields.
- Extracts structured eligibility rules matching the EligibilityRule model schema.
"""

import json
import logging
from typing import Optional

from app.services.ai_service import ai_service

logger = logging.getLogger("govscheme.scrapers.enrichment")


class AIEnrichmentService:
    """
    Leverages GovSchemeAI's existing AI Provider fallback chain
    to perform language translations and parse eligibility DSL criteria.
    """

    async def translate_text(self, text: str, field_name: str) -> Optional[str]:
        """Translate given English text into clean Hindi."""
        if not text:
            return None

        prompt = f"Translate the following government scheme {field_name} from English to clear Hindi (Devanagari script):\n\n{text}"
        system_prompt = "You are a professional Hindi translator. Output ONLY the translation. Do not write explanations or intro text."

        try:
            translated = await ai_service.generate(prompt, system_prompt, max_tokens=1024)
            return translated.strip()
        except Exception as e:
            logger.warning(f"Translation failed for {field_name}: {e}")
            return None

    async def extract_eligibility_rules(self, scheme_name: str, eligibility_text: str) -> list[dict]:
        """
        AI Parser: extracts structured rule conditions from unstructured eligibility description.
        Returns a list of dicts matching EligibilityRule fields.
        """
        if not eligibility_text:
            return []

        prompt = f"""
Analyze the unstructured eligibility description for the government scheme "{scheme_name}" and extract a structured list of eligibility rules.

Description:
"{eligibility_text}"

You must map the conditions to the following structured schema:
- rule_type: must be one of:
  ['age', 'income', 'gender', 'category', 'state', 'occupation', 'disability', 'is_student', 'is_farmer', 'is_woman', 'is_senior', 'land_holding', 'is_bpl']
- operator: must be one of:
  ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'between', 'bool']
- value: JSON compatible value matching operator:
  - 'between': e.g., {{"min": 18, "max": 40}}
  - 'in' / 'not_in': e.g., ["UP", "MP", "MH"] or ["farmer", "student"]
  - 'eq' / 'neq' / 'gt' / 'lt' / 'gte' / 'lte': single string or number, e.g. "male", 18, 200000
  - 'bool': true or false
- is_mandatory: boolean (true/false)
- description: clear 1-sentence English description of this single rule (e.g. "Applicant must be between 18 and 40 years old")

Output format: Return ONLY a valid JSON array of objects. Do NOT include markdown code blocks, backticks, or any explanatory text.

Example:
[
  {{
    "rule_type": "age",
    "operator": "between",
    "value": {{"min": 18, "max": 50}},
    "is_mandatory": true,
    "description": "Age must be between 18 and 50 years"
  }}
]
"""
        system_prompt = "You are a precise JSON extractor. Output ONLY a raw JSON array. Never wrap output in markdown formatting like ```json."

        try:
            raw_response = await ai_service.generate(prompt, system_prompt, max_tokens=1024)
            # Remove any accidentally generated backticks/markdown tags
            raw_response = raw_response.replace("```json", "").replace("```", "").strip()
            rules = json.loads(raw_response)
            if isinstance(rules, list):
                return rules
            return []
        except Exception as e:
            logger.error(f"Failed to parse AI eligibility rules: {e}. Raw response: {raw_response[:200] if 'raw_response' in locals() else 'None'}")
            return []

    async def enrich(self, normalized_scheme: dict, eligibility_text: str) -> dict:
        """
        Runs enrichment pipeline on a normalized scheme dictionary.
        Modifies and returns the dict with added translations and structured rules.
        """
        # 1. Generate translations if missing
        if not normalized_scheme.get("name_hi"):
            normalized_scheme["name_hi"] = await self.translate_text(
                normalized_scheme["name"], "name"
            )

        if not normalized_scheme.get("description_hi"):
            normalized_scheme["description_hi"] = await self.translate_text(
                normalized_scheme["description"], "description"
            )

        if not normalized_scheme.get("benefits_hi"):
            normalized_scheme["benefits_hi"] = await self.translate_text(
                normalized_scheme["benefits"], "benefits"
            )

        # 2. Extract structured eligibility rules
        rules = await self.extract_eligibility_rules(
            normalized_scheme["name"], eligibility_text
        )
        normalized_scheme["extracted_rules"] = rules

        return normalized_scheme
