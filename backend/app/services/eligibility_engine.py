import logging
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from app.models.scheme import Scheme, EligibilityRule

logger = logging.getLogger(__name__)

class RecommendationProfile(BaseModel):
    """
    Structured Pydantic model for user eligibility profile validation.
    """
    age: Optional[int] = None
    gender: Optional[str] = None  # male, female, transgender, other
    state: Optional[str] = None
    district: Optional[str] = None
    occupation: Optional[str] = None  # farmer, student, business_owner, unemployed, salaried, other
    annual_income: Optional[float] = None
    category: Optional[str] = None  # general, obc, sc, st
    disability: Optional[bool] = None
    is_farmer: Optional[bool] = None
    is_student: Optional[bool] = None
    is_business_owner: Optional[bool] = None
    employment_status: Optional[str] = None  # employed, unemployed, self_employed
    marital_status: Optional[str] = None  # single, married, widowed, divorced
    education: Optional[str] = None
    minority_status: Optional[bool] = None
    bpl_status: Optional[bool] = None
    family_size: Optional[int] = None
    land_holding: Optional[float] = None  # in hectares

    class Config:
        extra = "allow"  # Future attributes scalability

class EligibilityEngine:
    """
    Deterministic rules matching and explanation engine.
    Evaluates profile values against Scheme EligibilityRules.
    """

    def _get_user_value(self, profile: Any, rule_type: str) -> Tuple[Any, bool]:
        """
        Maps rule_type to the corresponding attribute inside the profile (supports multiple schema shapes).
        Returns: (value, is_present)
        """
        r_type = rule_type.lower()
        
        def get_field(name: str):
            val = getattr(profile, name, None)
            if val is None and isinstance(profile, dict):
                val = profile.get(name)
            return val

        if r_type == "age":
            v = get_field("age")
            return v, v is not None
        elif r_type in ("income", "annual_income"):
            v = get_field("annual_income")
            return v, v is not None
        elif r_type == "gender":
            v = get_field("gender")
            return v, v is not None
        elif r_type == "category":
            v = get_field("category")
            return v, v is not None
        elif r_type == "state":
            v = get_field("state")
            return v, v is not None
        elif r_type == "district":
            v = get_field("district")
            return v, v is not None
        elif r_type == "occupation":
            v = get_field("occupation")
            return v, v is not None
        elif r_type == "disability":
            v = get_field("disability")
            return v, v is not None
        elif r_type in ("is_farmer", "farmer"):
            v = get_field("is_farmer")
            if v is None:
                occ = get_field("occupation")
                v = (occ == "farmer") if occ else None
            return v, v is not None
        elif r_type in ("is_student", "student"):
            v = get_field("is_student")
            if v is None:
                occ = get_field("occupation")
                v = (occ == "student") if occ else None
            return v, v is not None
        elif r_type in ("is_business_owner", "business_owner", "business"):
            v = get_field("is_business_owner")
            if v is None:
                occ = get_field("occupation")
                v = (occ == "business_owner") if occ else None
            return v, v is not None
        elif r_type in ("bpl", "bpl_status", "is_bpl"):
            v = get_field("bpl_status")
            if v is None:
                v = get_field("is_bpl")
            return v, v is not None
        elif r_type in ("land_holding", "land_holding_hectares"):
            v = get_field("land_holding")
            if v is None:
                v = get_field("land_holding_hectares")
            return v, v is not None
        elif r_type == "marital_status":
            v = get_field("marital_status")
            return v, v is not None
        elif r_type == "minority_status":
            v = get_field("minority_status")
            return v, v is not None
        elif r_type == "education":
            v = get_field("education")
            return v, v is not None
        elif r_type == "employment_status":
            v = get_field("employment_status")
            return v, v is not None
        elif r_type == "family_size":
            v = get_field("family_size")
            return v, v is not None
        
        # Fallback to direct dict lookup for scalability attributes
        v = get_field(rule_type)
        if v is not None:
            return v, True
            
        return None, False

    def evaluate_rule(self, rule: EligibilityRule, profile: Any) -> bool:
        """
        Evaluates a single eligibility rule.
        Returns boolean for backward compatibility with legacy tests.
        """
        res = self.evaluate_rule_detailed(rule, profile)
        return res["passed"]

    def evaluate_rule_detailed(self, rule: EligibilityRule, profile: Any) -> Dict[str, Any]:
        """
        Evaluates a single eligibility rule and returns detailed status with description.
        """
        user_val, present = self._get_user_value(profile, rule.rule_type)
        desc = rule.description or f"{rule.rule_type} check"

        if not present:
            return {
                "passed": False,
                "unknown": True,
                "explanation": f"? Unknown {rule.rule_type} (requires {rule.rule_type} profile detail)"
            }

        op = rule.operator.lower()
        rule_val = rule.value
        passed = False

        def clean_str(v):
            return str(v).strip().lower() if v is not None else ""

        try:
            if op == "eq":
                if isinstance(user_val, str):
                    passed = clean_str(user_val) == clean_str(rule_val)
                else:
                    passed = user_val == rule_val
            elif op == "neq":
                if isinstance(user_val, str):
                    passed = clean_str(user_val) != clean_str(rule_val)
                else:
                    passed = user_val != rule_val
            elif op == "gt":
                passed = float(user_val) > float(rule_val)
            elif op == "lt":
                passed = float(user_val) < float(rule_val)
            elif op == "gte":
                passed = float(user_val) >= float(rule_val)
            elif op == "lte":
                passed = float(user_val) <= float(rule_val)
            elif op == "bool":
                passed = bool(user_val) == bool(rule_val)
            elif op == "in":
                target_list = [clean_str(x) for x in rule_val] if isinstance(rule_val, list) else [clean_str(rule_val)]
                passed = clean_str(user_val) in target_list
            elif op == "not_in":
                target_list = [clean_str(x) for x in rule_val] if isinstance(rule_val, list) else [clean_str(rule_val)]
                passed = clean_str(user_val) not in target_list
            elif op == "between":
                if isinstance(rule_val, dict):
                    min_val = float(rule_val.get("min", 0))
                    max_val = float(rule_val.get("max", 99999999))
                    passed = min_val <= float(user_val) <= max_val
                elif isinstance(rule_val, list) and len(rule_val) == 2:
                    passed = float(rule_val[0]) <= float(user_val) <= float(rule_val[1])
                else:
                    passed = False
            else:
                passed = False
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id}: {e}")
            passed = False

        symbol = "✓" if passed else "✗"
        explanation = f"{symbol} {desc}"

        return {
            "passed": passed,
            "unknown": False,
            "explanation": explanation
        }

    def evaluate_scheme(self, scheme: Scheme, profile: RecommendationProfile) -> Dict[str, Any]:
        """
        Determines user eligibility status for a scheme and builds explanations.
        """
        rules = scheme.eligibility_rules
        if not rules:
            return {
                "status": "Eligible",
                "explanations": ["✓ No specific eligibility restrictions"],
                "passed_count": 0,
                "total_count": 0,
                "is_eligible": True
            }

        passed_mandatory = True
        failed_mandatory_count = 0
        unknown_mandatory_count = 0
        passed_optional_count = 0
        failed_optional_count = 0
        unknown_optional_count = 0
        explanations = []

        for rule in rules:
            res = self.evaluate_rule_detailed(rule, profile)
            explanations.append(res["explanation"])

            if rule.is_mandatory:
                if res["unknown"]:
                    unknown_mandatory_count += 1
                elif not res["passed"]:
                    passed_mandatory = False
                    failed_mandatory_count += 1
            else:
                if res["unknown"]:
                    unknown_optional_count += 1
                elif res["passed"]:
                    passed_optional_count += 1
                else:
                    failed_optional_count += 1

        # Determine status
        if failed_mandatory_count > 0:
            status = "Not Eligible"
        elif unknown_mandatory_count > 0:
            status = "Unknown"
        else:
            # Meets all mandatory rules
            total_optional = passed_optional_count + failed_optional_count + unknown_optional_count
            if total_optional == 0:
                status = "Eligible"
            else:
                pct_optional_passed = (passed_optional_count / total_optional) * 100
                if failed_optional_count == 0 and unknown_optional_count == 0:
                    status = "Eligible"
                elif pct_optional_passed >= 50.0:
                    status = "Probably Eligible"
                else:
                    status = "Possibly Eligible"

        return {
            "status": status,
            "explanations": explanations,
            "passed_count": passed_optional_count + (len([r for r in rules if r.is_mandatory]) - failed_mandatory_count - unknown_mandatory_count),
            "total_count": len(rules),
            "is_eligible": status in ("Eligible", "Probably Eligible", "Possibly Eligible")
        }

    def _build_profile_summary(self, profile: Any) -> str:
        """
        Builds a human-readable text summary of the user's eligibility profile.
        """
        parts = []
        
        def get_field(name: str):
            val = getattr(profile, name, None)
            if val is None and isinstance(profile, dict):
                val = profile.get(name)
            return val

        age = get_field("age")
        gender = get_field("gender")
        if age is not None and gender:
            parts.append(f"{age} year old {gender}")
            
        state = get_field("state")
        if state:
            parts.append(f"from {state}")
            
        income = get_field("annual_income")
        if income is not None:
            parts.append(f"annual income: ₹{int(income):,}")
            
        occupation = get_field("occupation")
        if occupation:
            parts.append(str(occupation).strip().lower())
            
        is_bpl = get_field("bpl_status") or get_field("is_bpl")
        if is_bpl:
            parts.append("BPL")
            
        land = get_field("land_holding") or get_field("land_holding_hectares")
        if land is not None:
            parts.append(f"land: {land} hectares")
            
        return ", ".join(parts)

    async def check_eligibility(self, db: Any, request: Any) -> Any:
        """
        Evaluate active schemes eligibility for a request.
        """
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.scheme import Scheme
        from app.schemas.eligibility import EligibleSchemeResult, EligibilityResponse
        
        stmt = (
            select(Scheme)
            .where(Scheme.is_active == True)
            .options(
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.category)
            )
        )
        result = await db.execute(stmt)
        schemes = result.scalars().all()

        eligible_schemes = []
        profile = RecommendationProfile(
            age=getattr(request, "age", None),
            gender=getattr(request, "gender", None),
            state=getattr(request, "state", None),
            district=getattr(request, "district", None),
            occupation=getattr(request, "occupation", None),
            annual_income=getattr(request, "annual_income", None),
            category=getattr(request, "category", None),
            disability=getattr(request, "disability", None),
            is_farmer=getattr(request, "is_farmer", None),
            is_student=getattr(request, "is_student", None),
            is_woman=getattr(request, "is_woman", None),
            is_senior_citizen=getattr(request, "is_senior_citizen", None),
            bpl_status=getattr(request, "is_bpl", None),
            land_holding=getattr(request, "land_holding_hectares", None)
        )

        for scheme in schemes:
            eval_res = self.evaluate_scheme(scheme, profile)
            if eval_res["is_eligible"]:
                rules_matched = eval_res["passed_count"]
                rules_total = eval_res["total_count"]
                match_score = float(rules_matched) / float(rules_total) if rules_total > 0 else 1.0
                
                eligible_schemes.append(
                    EligibleSchemeResult(
                        id=scheme.id,
                        name=scheme.name,
                        name_hi=scheme.name_hi,
                        slug=scheme.slug,
                        ministry=scheme.ministry,
                        level=scheme.level,
                        benefits=scheme.benefits,
                        benefits_hi=scheme.benefits_hi,
                        benefits_amount=scheme.benefits_amount,
                        required_documents=scheme.required_documents or [],
                        application_url=scheme.application_url,
                        helpline=scheme.helpline,
                        deadline=str(scheme.deadline) if scheme.deadline else None,
                        scheme_type=scheme.scheme_type or [],
                        category_name=scheme.category.name if scheme.category else None,
                        category_icon=scheme.category.icon if scheme.category else None,
                        match_score=match_score,
                        rules_matched=rules_matched,
                        rules_total=rules_total
                    )
                )

        # Sort eligible schemes by match_score descending
        eligible_schemes.sort(key=lambda s: s.match_score, reverse=True)

        profile_summary = self._build_profile_summary(request)

        return EligibilityResponse(
            total_schemes_checked=len(schemes),
            eligible_count=len(eligible_schemes),
            schemes=eligible_schemes,
            profile_summary=profile_summary
        )

eligibility_engine = EligibilityEngine()
