import logging
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import select, func, desc, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models.scheme import Scheme, EligibilityRule, Category
from app.models.user import User, UserScheme
from app.models.recommendation import RecommendationCache, RecommendationAnalytics
from app.services.eligibility_engine import eligibility_engine, RecommendationProfile

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Scoring, Ranking, Caching, and Filtering of Government Schemes
    tailored to the user's RecommendationProfile.
    """

    def _calculate_benefit_score(self, scheme: Scheme, profile: RecommendationProfile) -> float:
        """
        Calculates Benefit Match (Max: 20 pts).
        """
        score = 5.0  # Base benefit points
        
        # Check occupation and sector matches
        occupation = (profile.occupation or "").lower()
        scheme_types = [str(t).lower() for t in (scheme.scheme_type or [])]
        tags = [str(t).lower() for t in (scheme.tags or [])]

        if occupation and (occupation in scheme_types or occupation in tags):
            score += 8.0

        # Student status checks
        if profile.is_student and ("student" in scheme_types or "student" in tags or "education" in scheme_types):
            score += 5.0
            
        # Farmer status checks
        if profile.is_farmer and ("farmer" in scheme_types or "farmer" in tags or "agriculture" in scheme_types):
            score += 5.0

        # Business owner checks
        if profile.is_business_owner and ("business" in scheme_types or "business" in tags or "startup" in scheme_types):
            score += 5.0

        return min(score, 20.0)

    def _calculate_location_score(self, scheme: Scheme, profile: RecommendationProfile) -> float:
        """
        Calculates Location Relevance (Max: 15 pts).
        """
        score = 0.0
        user_state = (profile.state or "").strip().lower()
        scheme_level = (scheme.level or "").strip().lower()

        if scheme_level == "central":
            score += 7.0  # Central schemes apply to all
        elif user_state and scheme.state_code:
            # Check state exact match (with code to name mapping fallback)
            state_mapping = {
                "ap": "andhra pradesh", "ar": "arunachal pradesh", "as": "assam", "br": "bihar",
                "cg": "chhattisgarh", "ga": "goa", "gj": "gujarat", "hr": "haryana",
                "hp": "himachal pradesh", "jh": "jharkhand", "ka": "karnataka", "kl": "kerala",
                "mp": "madhya pradesh", "mh": "maharashtra", "mn": "manipur", "ml": "meghalaya",
                "mz": "mizoram", "nl": "nagaland", "od": "odisha", "pb": "punjab",
                "rj": "rajasthan", "sk": "sikkim", "tn": "tamil nadu", "tg": "telangana",
                "tr": "tripura", "up": "uttar pradesh", "uk": "uttarakhand", "wb": "west bengal"
            }
            s_code = scheme.state_code.strip().lower()
            mapped_name = state_mapping.get(s_code, s_code)
            if s_code == user_state or mapped_name == user_state or s_code in user_state or user_state in s_code:
                score += 12.0

        user_district = (profile.district or "").strip().lower()
        if user_district and scheme.department and user_district in scheme.department.lower():
            score += 3.0

        return min(score, 15.0)

    def _calculate_freshness_score(self, scheme: Scheme) -> float:
        """
        Calculates Freshness/Fresh Updates (Max: 10 pts).
        """
        now = datetime.utcnow()
        last_updated = scheme.last_updated or scheme.created_at or now
        delta = now - last_updated

        if delta.days <= 15:
            return 10.0
        elif delta.days <= 30:
            return 8.0
        elif delta.days <= 60:
            return 5.0
        return 2.0

    async def get_popularity_metrics(self, db: AsyncSession) -> Dict[str, int]:
        """
        Retrieves scheme action counts to compute relative popularity metrics.
        """
        # Count bookmarks/clicks per scheme
        stmt = select(
            RecommendationAnalytics.scheme_id,
            func.count(RecommendationAnalytics.id)
        ).group_by(RecommendationAnalytics.scheme_id)
        res = await db.execute(stmt)
        return {scheme_id: count for scheme_id, count in res.all()}

    async def rank_schemes(self, db: AsyncSession, profile: RecommendationProfile, popularity_map: Dict[str, int]) -> List[Dict[str, Any]]:
        """
        Computes weighted scores, explanations, and ranks all active schemes in the database.
        """
        # Fetch all active schemes along with eligibility rules
        stmt = select(Scheme).options(selectinload(Scheme.eligibility_rules)).where(Scheme.is_active == True)
        res = await db.execute(stmt)
        schemes = res.scalars().all()

        ranked_results = []

        for scheme in schemes:
            # 1. Eligibility evaluation
            elig_res = eligibility_engine.evaluate_scheme(scheme, profile)
            
            # Skip strictly "Not Eligible" schemes from primary recommendation matching
            if elig_res["status"] == "Not Eligible":
                continue

            # Weight 1: Eligibility (Max: 50)
            status_scores = {
                "Eligible": 50.0,
                "Probably Eligible": 35.0,
                "Possibly Eligible": 20.0,
                "Unknown": 10.0
            }
            elig_score = status_scores.get(elig_res["status"], 0.0)

            # Weight 2: Benefit Match (Max: 20)
            benefit_score = self._calculate_benefit_score(scheme, profile)

            # Weight 3: Location Match (Max: 15)
            loc_score = self._calculate_location_score(scheme, profile)

            # Weight 4: Freshness (Max: 10)
            fresh_score = self._calculate_freshness_score(scheme)

            # Weight 5: Popularity (Max: 5)
            clicks = popularity_map.get(scheme.id, 0)
            pop_score = min(clicks * 0.5, 5.0)

            # Total score summation
            total_score = elig_score + benefit_score + loc_score + fresh_score + pop_score
            percentage_score = round((total_score / 100.0) * 100.0, 1)

            # Build explainable points
            explanation_points = []
            if occupation := (profile.occupation or ""):
                if occupation in [str(t).lower() for t in (scheme.scheme_type or [])]:
                    explanation_points.append(f"Tailored for {occupation.capitalize()}s")
            if profile.is_student and "student" in [str(t).lower() for t in (scheme.scheme_type or [])]:
                explanation_points.append("Educational support benefits")
            if scheme_level := (scheme.level or ""):
                if scheme_level.lower() == "central":
                    explanation_points.append("Nationwide central scheme benefit")
                elif profile.state:
                    explanation_points.append(f"State-specific scheme for {profile.state}")

            # Append the top eligibility checklist indicators
            passed_exps = [e.replace("✓ ", "") for e in elig_res["explanations"] if e.startswith("✓")]
            explanation_points.extend(passed_exps[:3])

            ranked_results.append({
                "scheme_id": scheme.id,
                "name": scheme.name,
                "slug": scheme.slug,
                "score": percentage_score,
                "status": elig_res["status"],
                "explanations": elig_res["explanations"],
                "brief_reasons": explanation_points[:4],
                "last_updated": scheme.last_updated.isoformat() + "Z" if scheme.last_updated else None,
                "deadline": scheme.deadline.isoformat() if scheme.deadline else None,
                "benefits_amount": scheme.benefits_amount,
                "official_website": scheme.official_website or scheme.application_url
            })

        # Sort by score descending
        ranked_results.sort(key=lambda x: x["score"], reverse=True)
        return ranked_results

    async def get_recommendations_for_user(self, db: AsyncSession, user_id: str, profile_override: Optional[RecommendationProfile] = None) -> List[Dict[str, Any]]:
        """
        Retrieves recommendations for a user. Pulls from RecommendationCache if fresh,
        otherwise recalculates, saves cache, and returns ranked schemes.
        """
        # Fetch user
        user = await db.get(User, user_id)
        if not user:
            raise FileNotFoundError(f"User with ID {user_id} not found.")

        profile_data = profile_override or RecommendationProfile.model_validate(user.profile or {})

        # Check Cache
        cache_stmt = select(RecommendationCache).where(RecommendationCache.user_id == user_id)
        cache_rec = (await db.execute(cache_stmt)).scalar()
        
        # If cache exists and is newer than 1 hour, return it (unless override specified)
        if cache_rec and not profile_override:
            cache_age = datetime.utcnow() - cache_rec.updated_at
            if cache_age < timedelta(hours=1):
                logger.info(f"Serving recommendations cache hit for user {user_id}")
                return cache_rec.recommendations

        # Compute fresh recommendations
        popularity_map = await self.get_popularity_metrics(db)
        ranked = await self.rank_schemes(db, profile_data, popularity_map)

        # Update cache
        if not profile_override:
            if cache_rec:
                cache_rec.recommendations = ranked
                cache_rec.updated_at = datetime.utcnow()
            else:
                cache_rec = RecommendationCache(
                    user_id=user_id,
                    recommendations=ranked
                )
                db.add(cache_rec)
            await db.commit()

        return ranked

    async def invalidate_user_cache(self, db: AsyncSession, user_id: str):
        """Invalidates precomputed recommendations cache for a user."""
        stmt = delete(RecommendationCache).where(RecommendationCache.user_id == user_id)
        await db.execute(stmt)
        await db.commit()

    async def track_recommendation_action(self, db: AsyncSession, user_id: Optional[str], scheme_id: str, action: str):
        """Logs telemetry action (impression, click, bookmark, apply) for dashboard analytics."""
        accepted = action in ("bookmark", "apply")
        log = RecommendationAnalytics(
            user_id=user_id,
            scheme_id=scheme_id,
            action=action,
            accepted=accepted
        )
        db.add(log)
        await db.commit()

recommendation_engine = RecommendationEngine()
