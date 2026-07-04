import re
import time
import logging
from datetime import datetime
from functools import lru_cache
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheme import Scheme, EligibilityRule, Category
from app.models.search_history import SearchHistory
from app.services.cache import cache

logger = logging.getLogger("yojana.search")

# Synonym expansion dictionary mappings
SYNONYMS = {
    "pension": ["allowance", "financial assistance", "senior citizen", "old age", "social security"],
    "farmer": ["kisan", "krishi", "agriculture", "cultivator", "crop"],
    "kisan": ["farmer", "krishi", "agriculture", "cultivator", "crop"],
    "student": ["scholarship", "education", "school", "fellowship", "college"],
    "health": ["medical", "hospital", "insurance", "treatment", "ayushman", "healthcare"],
    "housing": ["awas", "home", "shelter", "construction", "pradhan mantri awas yojana"],
    "business": ["msme", "loan", "startup", "entrepreneur", "mudra", "credit"]
}


class IntelligentSearchService:
    """
    Intelligent search and indexing service featuring synonym expansion, fuzzy
    relevance scoring, prefix matches, autocomplete suggestions, and analytics logs.
    """

    async def search_schemes(
        self,
        db: AsyncSession,
        query: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "relevance",
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Executes a smart query search with expanded synonyms, scoring calculations,
        database filters (age, gender, income), and latency history logs.
        """
        start_time = time.time()
        filters = filters or {}

        # 1. Base Query Candidates Retrieval
        stmt = select(Scheme).options(
            selectinload(Scheme.category),
            selectinload(Scheme.eligibility_rules)
        )

        # Preprocess and tokenize query if present to push text filtering to SQL
        expanded_tokens = []
        clean_query = ""
        if query:
            clean_query = re.sub(r"[^\w\s]", "", query.lower()).strip()
            query_tokens = clean_query.split()

            # Expand tokens via synonyms dictionary
            expanded_tokens = list(query_tokens)
            for tok in query_tokens:
                if tok in SYNONYMS:
                    expanded_tokens.extend(SYNONYMS[tok])
            # De-duplicate expanded tokens
            expanded_tokens = list(set(expanded_tokens))

            if expanded_tokens:
                search_conditions = []
                for token in expanded_tokens:
                    token_pattern = f"%{token}%"
                    search_conditions.append(Scheme.name.ilike(token_pattern))
                    search_conditions.append(Scheme.ministry.ilike(token_pattern))
                    search_conditions.append(Scheme.department.ilike(token_pattern))
                    search_conditions.append(Scheme.description.ilike(token_pattern))
                    search_conditions.append(Scheme.benefits.ilike(token_pattern))
                stmt = stmt.where(or_(*search_conditions))

        # Apply basic status/active filters
        active_only = filters.get("active_only", True)
        if active_only:
            stmt = stmt.where(Scheme.is_active == True)

        # Category filter
        if filters.get("category"):
            stmt = stmt.join(Category).where(Category.slug == filters["category"])

        # State filter
        if filters.get("state"):
            state = filters["state"].lower()
            stmt = stmt.where(or_(func.lower(Scheme.state_code) == state, Scheme.level == "central"))

        # Ministry filter
        if filters.get("ministry"):
            stmt = stmt.where(Scheme.ministry.ilike(f"%{filters['ministry']}%"))

        # Department filter
        if filters.get("department"):
            stmt = stmt.where(Scheme.department.ilike(f"%{filters['department']}%"))

        # Status filter
        if filters.get("status"):
            stmt = stmt.where(Scheme.status == filters["status"])

        # Execute candidate fetch
        res = await db.execute(stmt)
        candidates = res.scalars().all()

        # 2. Eligibility filters (Age, Gender, Income) in Python to handle JSON/Relation rules precisely
        filtered_candidates = []
        age_filter = filters.get("age")
        gender_filter = filters.get("gender")
        income_filter = filters.get("income")

        for s in candidates:
            # Check eligibility rules
            eligible = True
            for rule in s.eligibility_rules:
                if rule.rule_type == "age" and age_filter is not None:
                    op = rule.operator
                    val = rule.value
                    if op == "eq" and age_filter != val:
                        eligible = False
                    elif op == "gt" and age_filter <= val:
                        eligible = False
                    elif op == "lt" and age_filter >= val:
                        eligible = False
                    elif op == "gte" and age_filter < val:
                        eligible = False
                    elif op == "lte" and age_filter > val:
                        eligible = False
                    elif op == "between":
                        if isinstance(val, dict):
                            val_min = val.get("min")
                            val_max = val.get("max")
                            if val_min is not None and age_filter < val_min:
                                eligible = False
                            if val_max is not None and age_filter > val_max:
                                eligible = False

                elif rule.rule_type == "income" and income_filter is not None:
                    op = rule.operator
                    val = rule.value
                    if op == "lte" and income_filter > val:
                        eligible = False
                    elif op == "lt" and income_filter >= val:
                        eligible = False
                    elif op == "eq" and income_filter != val:
                        eligible = False

                elif rule.rule_type == "gender" and gender_filter is not None and gender_filter.lower() != "any":
                    op = rule.operator
                    val = rule.value
                    if op == "eq":
                        if isinstance(val, str) and val.lower() not in ("any", "all", gender_filter.lower()):
                            eligible = False
                    elif op == "in":
                        if isinstance(val, list) and not any(g.lower() == gender_filter.lower() for g in val):
                            eligible = False

            if eligible:
                filtered_candidates.append(s)

        # 3. Fuzzy Scoring of Pre-Filtered Candidates
        scored_results = []
        if query and expanded_tokens:
            # Relevance scoring loop
            for s in filtered_candidates:
                score = 0.0
                name_lower = s.name.lower()

                # Exact Match on name
                if clean_query == name_lower:
                    score += 10.0
                # Prefix Match on name
                elif name_lower.startswith(clean_query):
                    score += 5.0

                # Token matching weightings
                for token in expanded_tokens:
                    # Token occurs in Scheme Name
                    if token in name_lower:
                        score += 3.0
                    # Token occurs in Ministry or Department
                    if s.ministry and token in s.ministry.lower():
                        score += 2.0
                    if s.department and token in s.department.lower():
                        score += 2.0
                    # Token occurs in Description or Benefits
                    if s.description and token in s.description.lower():
                        score += 1.0
                    if s.benefits and token in s.benefits.lower():
                        score += 1.0

                # Keep candidates matching search criteria
                if score > 0:
                    scored_results.append((s, score))
        else:
            # If no query string, rank all candidates default
            scored_results = [(s, 1.0) for s in filtered_candidates]

        # 4. Sorting logic
        if sort_by == "relevance" and query:
            scored_results.sort(key=lambda x: x[1], reverse=True)
        elif sort_by == "newest":
            scored_results.sort(key=lambda x: x[0].launched_date or datetime.min, reverse=True)
        elif sort_by == "updated":
            scored_results.sort(key=lambda x: x[0].last_checked or datetime.min, reverse=True)
        else:
            # Alphabetical default
            scored_results.sort(key=lambda x: x[0].name)

        total_results = len(scored_results)

        # 5. Pagination boundary limits
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_tuples = scored_results[start_idx:end_idx]

        results = []
        for s, score in paginated_tuples:
            results.append({
                "id": s.id,
                "name": s.name,
                "slug": s.slug,
                "description": s.description,
                "ministry": s.ministry,
                "department": s.department,
                "state": s.state_code,
                "status": s.status,
                "relevance_score": round(score, 2)
            })

        # 6. Save Search History Metrics log
        duration_ms = (time.time() - start_time) * 1000.0
        
        # Phase 21 telemetry metrics
        from app.utils.observability import SEARCH_LATENCY_SECONDS
        SEARCH_LATENCY_SECONDS.observe(duration_ms / 1000.0)

        if query:
            history_log = SearchHistory(
                query=query,
                results_count=total_results,
                execution_time_ms=duration_ms,
                filters_used=filters
            )
            db.add(history_log)
            await db.commit()

        return results, total_results

    async def get_autocomplete(self, db: AsyncSession, prefix: str) -> List[str]:
        """Returns prefix suggestions matching active scheme names."""
        if not prefix:
            return []

        clean_prefix = prefix.strip().lower()
        cache_key = f"autocomplete_{clean_prefix}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        stmt = select(Scheme.name).where(
            (Scheme.is_active == True) &
            (Scheme.name.ilike(f"{clean_prefix}%"))
        ).order_by(Scheme.name).limit(5)

        res = await db.execute(stmt)
        suggestions = list(res.scalars().all())
        await cache.set(cache_key, suggestions, ttl_seconds=60.0)
        return suggestions

    async def get_analytics(self, db: AsyncSession) -> Dict[str, Any]:
        """Aggregates search counts, latency averages, and no-result queries."""
        total_searches_res = await db.execute(select(func.count(SearchHistory.id)))
        total_searches = total_searches_res.scalar() or 0

        avg_latency_res = await db.execute(select(func.avg(SearchHistory.execution_time_ms)))
        avg_latency = avg_latency_res.scalar() or 0.0

        no_results_res = await db.execute(select(func.count(SearchHistory.id)).where(SearchHistory.results_count == 0))
        no_results = no_results_res.scalar() or 0

        # Most searched queries
        popular_res = await db.execute(
            select(SearchHistory.query, func.count(SearchHistory.id).label("cnt"))
            .group_by(SearchHistory.query)
            .order_by(desc("cnt"))
            .limit(5)
        )
        popular_queries = [{"query": row[0], "count": row[1]} for row in popular_res.all()]

        return {
            "total_searches": total_searches,
            "average_latency_ms": round(avg_latency, 2),
            "no_results_count": no_results,
            "popular_queries": popular_queries
        }


# Singleton
search_engine = IntelligentSearchService()
