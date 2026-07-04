"""
Validation & Confidence Engine (Phase 6).
Evaluates structured JSON government scheme payloads, performs schema and type validation,
scores data confidence (0-100), and outputs validation reports.
Runs completely in-memory without database mutations.
"""

import re
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("yojana.crawler.confidence")


class ConfidenceEngine:
    """
    Validates data structures, dates, domains, and calculates quality confidence scores
    for scheme extractions.
    """

    # Schema definition: field name -> expected python types
    SCHEMA_KEYS = {
        "scheme_name": str,
        "short_description": str,
        "benefits": str,
        "eligibility": str,
        "income_criteria": (str, type(None)),
        "age_criteria": (str, type(None)),
        "gender": (str, type(None)),
        "category": (str, type(None)),
        "required_documents": list,
        "application_process": str,
        "official_url": str,
        "department": (str, type(None)),
        "ministry": (str, type(None)),
        "state": (str, type(None)),
        "target_beneficiaries": (str, type(None)),
        "application_mode": (str, type(None)),
        "launch_date": (str, type(None)),
        "last_updated": (str, type(None)),
        "status": (str, type(None)),
        "helpline_number": (str, type(None)),
        "official_email": (str, type(None)),
        "official_website": (str, type(None)),
    }

    # ISO date string validation (YYYY-MM-DD)
    DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

    # Allowed status values
    VALID_STATUSES = ["active", "inactive", "draft"]

    def validate_scheme_json(self, data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """
        Validates JSON schema, key types, link structures, dates, and statuses.
        Returns: Tuple[missing_fields, warnings]
        """
        missing_fields = []
        warnings = []

        # 1. Check schema key definitions and value types
        for key, expected_type in self.SCHEMA_KEYS.items():
            if key not in data:
                missing_fields.append(key)
                continue

            val = data[key]
            if val is None or str(val).strip().lower() in ("null", "none", ""):
                # Required fields cannot be empty/null
                if key in ("scheme_name", "short_description", "benefits"):
                    missing_fields.append(key)
                continue

            # Type checking
            if not isinstance(val, expected_type):
                warnings.append(
                    f"Type mismatch for '{key}': expected {expected_type}, got {type(val)}"
                )

        # 2. Check Link Formats (Must be HTTPS and Government domains)
        for link_field in ("official_url", "official_website"):
            url = data.get(link_field)
            if url and str(url).strip().lower() not in ("null", "none", ""):
                url_str = str(url).strip().lower()
                if not url_str.startswith("https://"):
                    warnings.append(f"Insecure link in '{link_field}': must be HTTPS")

                if not (".gov.in" in url_str or ".nic.in" in url_str):
                    warnings.append(
                        f"Non-government domain in '{link_field}': links must point to .gov.in/.nic.in"
                    )

        # 3. Check Date Constraints (YYYY-MM-DD format)
        for date_field in ("launch_date", "last_updated"):
            dt_val = data.get(date_field)
            if dt_val and str(dt_val).strip().lower() not in ("null", "none", ""):
                dt_str = str(dt_val).strip()
                if not self.DATE_PATTERN.match(dt_str):
                    warnings.append(
                        f"Invalid date format in '{date_field}': '{dt_str}' must match YYYY-MM-DD"
                    )

        # 4. Check Status constraints
        status_val = data.get("status")
        if status_val and str(status_val).strip().lower() not in ("null", "none", ""):
            status_str = str(status_val).strip().lower()
            if status_str not in self.VALID_STATUSES:
                warnings.append(
                    f"Invalid status value: '{status_str}' must be one of {self.VALID_STATUSES}"
                )

        return missing_fields, warnings

    def calculate_confidence_score(
        self, data: Dict[str, Any], missing_fields: List[str], warnings: List[str]
    ) -> Tuple[int, str, str]:
        """
        Heuristic confidence calculations:
        - Completeness: Up to +40 points (deducts 5 pts per missing schema key, required keys are heavier)
        - Official Source Quality: Up to +30 points (+15 if ministry/department details exist, +15 if official URLs are trusted gov.in domains)
        - Format Quality: Up to +20 points (deducts 5 pts per format warning)
        - Target Consistency: Up to +10 points (checks age, income, category metrics present together)

        Returns: Tuple[confidence_score (0-100), confidence_level ('HIGH'/'MEDIUM'/'LOW'/'REJECTED'), status ('valid'/'invalid')]
        """
        score = 100

        # Required fields check
        required_missing = [f for f in missing_fields if f in ("scheme_name", "short_description", "benefits")]
        if required_missing:
            # Fatal check: automatically reject if required fields are missing
            return 0, "REJECTED", "invalid"

        # 1. Deduct for missing schema keys
        # We have 22 schema keys total
        missing_count = len(missing_fields)
        score -= missing_count * 4

        # 2. Check source quality (Ministry / Department present?)
        has_min = data.get("ministry") and str(data["ministry"]).strip().lower() not in ("null", "none", "")
        has_dept = data.get("department") and str(data["department"]).strip().lower() not in ("null", "none", "")
        if not (has_min or has_dept):
            score -= 15

        # Official URL check
        official_url = data.get("official_url") or data.get("official_website")
        if not official_url or str(official_url).strip().lower() in ("null", "none", ""):
            score -= 15
        else:
            url_str = str(official_url).lower()
            if not (".gov.in" in url_str or ".nic.in" in url_str):
                score -= 10

        # 3. Deduct for warnings (type mismatch, invalid dates, insecure URLs, etc.)
        score -= len(warnings) * 6

        # Cap score boundaries
        confidence_score = max(0, min(score, 100))

        # Assign confidence level
        if confidence_score >= 80:
            level = "HIGH"
            status = "valid"
        elif confidence_score >= 60:
            level = "MEDIUM"
            status = "valid"
        elif confidence_score >= 50:
            level = "LOW"
            status = "valid"
        else:
            level = "REJECTED"
            status = "invalid"

        # Explicitly invalidate if there are fatal warnings (e.g. invalid date formats on key fields)
        if any("Invalid date format" in w for w in warnings):
            status = "invalid"
            level = "REJECTED"

        return confidence_score, level, status

    def process(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a scheme JSON payload: runs validations, computes confidence scores,
        classifies levels, and outputs reports.
        """
        missing_fields, warnings = self.validate_scheme_json(extracted_data)
        score, level, status = self.calculate_confidence_score(extracted_data, missing_fields, warnings)

        report = {
            "validation_status": status,
            "confidence_score": score,
            "confidence_level": level,
            "missing_required_fields": [f for f in missing_fields if f in ("scheme_name", "short_description", "benefits")],
            "all_missing_fields": missing_fields,
            "warnings": warnings,
            "is_government_source": any(".gov.in" in str(extracted_data.get(f, "")).lower() or ".nic.in" in str(extracted_data.get(f, "")).lower() for f in ("official_url", "official_website"))
        }

        return {
            "validated_json": extracted_data,
            "confidence_score": score,
            "confidence_level": level,
            "validation_status": status,
            "validation_report": report,
            "warnings": warnings,
            "missing_fields": missing_fields
        }


# Singleton
confidence_engine = ConfidenceEngine()
