"""
Duplicate Detection & Canonicalization Engine (Phase 7).
Audits scheme duplicate candidates, chooses canonical names, lists aliases,
and generates conflict reports for inconsistent properties.
Operates entirely in-memory.
"""

import logging
from typing import Dict, Any, List, Tuple
from thefuzz import fuzz

logger = logging.getLogger("yojana.crawler.duplicate")


class DuplicateEngine:
    """
    Coordinates four independent agents to identify duplicates, resolve names,
    calculate weighted similarity scores, and flag metadata conflicts.
    """

    # Similarity weight configurations
    WEIGHTS = {
        "name": 0.35,
        "official_url": 0.25,
        "benefits": 0.15,
        "eligibility": 0.15,
        "dept_ministry": 0.10
    }

    def clean_text(self, text: Any) -> str:
        """Helper to standardize text strings for comparison."""
        if not text or str(text).strip().lower() in ("null", "none"):
            return ""
        return str(text).strip().lower()

    def run_similarity_agent(self, new_scheme: Dict[str, Any], existing_scheme: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Agent 3: Similarity Engine.
        Executes exact, normalized, URL, and fuzzy matching strategies across key fields.
        Returns: Tuple[similarity_score (0-100), list of matching_fields]
        """
        matching_fields = []
        weighted_score = 0.0

        # 1. Scheme Name Match (35%)
        name_new = self.clean_text(new_scheme.get("scheme_name") or new_scheme.get("name"))
        name_ext = self.clean_text(existing_scheme.get("scheme_name") or existing_scheme.get("name"))
        if name_new and name_ext:
            if name_new == name_ext:
                weighted_score += self.WEIGHTS["name"] * 100
                matching_fields.append("scheme_name")
            else:
                ratio = fuzz.token_sort_ratio(name_new, name_ext)
                weighted_score += self.WEIGHTS["name"] * ratio
                if ratio >= 85:
                    matching_fields.append("scheme_name")

        # 2. Official URL Match (25%)
        url_new = self.clean_text(new_scheme.get("official_url") or new_scheme.get("official_website") or new_scheme.get("application_url"))
        url_ext = self.clean_text(existing_scheme.get("official_url") or existing_scheme.get("official_website") or existing_scheme.get("application_url"))
        if url_new and url_ext:
            if url_new == url_ext:
                weighted_score += self.WEIGHTS["official_url"] * 100
                matching_fields.append("official_url")
            else:
                # Fuzzy link matching (domain matching)
                ratio = fuzz.ratio(url_new, url_ext)
                weighted_score += self.WEIGHTS["official_url"] * ratio
                if ratio >= 80:
                    matching_fields.append("official_url")

        # 3. Benefits Match (15%)
        ben_new = self.clean_text(new_scheme.get("benefits") or new_scheme.get("benefits_amount"))
        ben_ext = self.clean_text(existing_scheme.get("benefits") or existing_scheme.get("benefits_amount"))
        if ben_new and ben_ext:
            if ben_new == ben_ext:
                weighted_score += self.WEIGHTS["benefits"] * 100
                matching_fields.append("benefits")
            else:
                ratio = fuzz.token_sort_ratio(ben_new, ben_ext)
                weighted_score += self.WEIGHTS["benefits"] * ratio
                if ratio >= 80:
                    matching_fields.append("benefits")

        # 4. Eligibility Match (15%)
        elg_new = self.clean_text(new_scheme.get("eligibility"))
        elg_ext = self.clean_text(existing_scheme.get("eligibility"))
        if elg_new and elg_ext:
            if elg_new == elg_ext:
                weighted_score += self.WEIGHTS["eligibility"] * 100
                matching_fields.append("eligibility")
            else:
                ratio = fuzz.token_sort_ratio(elg_new, elg_ext)
                weighted_score += self.WEIGHTS["eligibility"] * ratio
                if ratio >= 80:
                    matching_fields.append("eligibility")

        # 5. Ministry & Department Match (10%)
        min_new = self.clean_text(new_scheme.get("ministry"))
        min_ext = self.clean_text(existing_scheme.get("ministry"))
        dept_new = self.clean_text(new_scheme.get("department"))
        dept_ext = self.clean_text(existing_scheme.get("department"))

        min_match = (min_new and min_ext and (min_new == min_ext or fuzz.token_sort_ratio(min_new, min_ext) >= 85))
        dept_match = (dept_new and dept_ext and (dept_new == dept_ext or fuzz.token_sort_ratio(dept_new, dept_ext) >= 85))

        if min_match or dept_match:
            weighted_score += self.WEIGHTS["dept_ministry"] * 100
            if min_match:
                matching_fields.append("ministry")
            if dept_match:
                matching_fields.append("department")

        return round(weighted_score, 2), matching_fields

    def run_canonicalization_agent(self, name_a: str, name_b: str) -> Tuple[str, List[str]]:
        """
        Agent 2: Canonicalization Agent.
        Chooses the canonical name by preferring the longer/more expanded version.
        Generates list of alias variants.
        """
        clean_a = name_a.strip()
        clean_b = name_b.strip()

        # Decide canonical: prefer the longer name (contains expansions)
        if len(clean_a) >= len(clean_b):
            canonical = clean_a
            aliases = [clean_b] if clean_a != clean_b else []
        else:
            canonical = clean_b
            aliases = [clean_a]

        return canonical, aliases

    def run_conflict_agent(self, new_scheme: Dict[str, Any], existing_scheme: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agent 4: Conflict Detection Agent.
        Flags mismatches in key content fields (benefits, eligibility, urls, department).
        Does NOT automatically merge or resolve conflicts.
        """
        conflicts = {}

        # 1. URL Conflict
        url_new = self.clean_text(new_scheme.get("official_url"))
        url_ext = self.clean_text(existing_scheme.get("official_url"))
        if url_new and url_ext and url_new != url_ext:
            conflicts["official_url"] = {
                "new": new_scheme.get("official_url"),
                "existing": existing_scheme.get("official_url")
            }

        # 2. Benefits Conflict
        ben_new = self.clean_text(new_scheme.get("benefits"))
        ben_ext = self.clean_text(existing_scheme.get("benefits"))
        if ben_new and ben_ext and fuzz.token_sort_ratio(ben_new, ben_ext) < 85:
            conflicts["benefits"] = {
                "new": new_scheme.get("benefits"),
                "existing": existing_scheme.get("benefits")
            }

        # 3. Eligibility Conflict
        elg_new = self.clean_text(new_scheme.get("eligibility"))
        elg_ext = self.clean_text(existing_scheme.get("eligibility"))
        if elg_new and elg_ext and fuzz.token_sort_ratio(elg_new, elg_ext) < 85:
            conflicts["eligibility"] = {
                "new": new_scheme.get("eligibility"),
                "existing": existing_scheme.get("eligibility")
            }

        # 4. Department Conflict
        dept_new = self.clean_text(new_scheme.get("department"))
        dept_ext = self.clean_text(existing_scheme.get("department"))
        if dept_new and dept_ext and dept_new != dept_ext:
            conflicts["department"] = {
                "new": new_scheme.get("department"),
                "existing": existing_scheme.get("department")
            }

        # 5. Status Conflict
        st_new = self.clean_text(new_scheme.get("status"))
        st_ext = self.clean_text(existing_scheme.get("status"))
        if st_new and st_ext and st_new != st_ext:
            conflicts["status"] = {
                "new": new_scheme.get("status"),
                "existing": existing_scheme.get("status")
            }

        return conflicts

    def process_duplicate_check(
        self, existing_schemes: List[Dict[str, Any]], new_scheme: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Agent 1: Duplicate Detection Agent / Pipeline Orchestrator.
        Compares new_scheme with all existing schemes, runs agents, and generates final analysis payload.
        """
        name_new = new_scheme.get("scheme_name") or new_scheme.get("name") or ""
        best_match_scheme = None
        best_similarity_score = 0.0
        best_matching_fields = []

        # Find best duplicate candidate
        for ext in existing_schemes:
            score, fields = self.run_similarity_agent(new_scheme, ext)
            if score > best_similarity_score:
                best_similarity_score = score
                best_match_scheme = ext
                best_matching_fields = fields

        # 2. Compute canonicalization name & aliases
        if best_match_scheme:
            name_ext = best_match_scheme.get("scheme_name") or best_match_scheme.get("name") or ""
            canonical_name, alias_names = self.run_canonicalization_agent(name_new, name_ext)
            conflict_report = self.run_conflict_agent(new_scheme, best_match_scheme)
        else:
            canonical_name = name_new
            alias_names = []
            conflict_report = {}

        # 3. Determine recommendations and scores
        duplicate_candidates = []
        if best_match_scheme:
            duplicate_candidates.append({
                "id": best_match_scheme.get("id"),
                "name": best_match_scheme.get("name") or best_match_scheme.get("scheme_name"),
                "slug": best_match_scheme.get("slug")
            })

        # Threshold rules
        # Threshold rules
        if best_similarity_score < 50.0:
            recommendation = "unique"
            conflict_report = {}
            duplicate_candidates = []
        elif len(conflict_report) > 0:
            recommendation = "review_required"
        elif best_similarity_score >= 85.0:
            recommendation = "duplicate"
        else:
            recommendation = "review_required"

        confidence_score = max(0.0, min(100.0, best_similarity_score))

        return {
            "canonical_name": canonical_name,
            "duplicate_candidates": duplicate_candidates,
            "duplicate_score": best_similarity_score,
            "similarity_score": best_similarity_score,
            "alias_names": alias_names,
            "conflict_report": conflict_report,
            "matching_fields": best_matching_fields,
            "confidence_score": confidence_score,
            "recommendation": recommendation
        }


# Singleton
duplicate_engine = DuplicateEngine()
