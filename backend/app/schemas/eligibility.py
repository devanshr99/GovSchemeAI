"""
Eligibility request/response schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class EligibilityRequest(BaseModel):
    """User profile submitted to check scheme eligibility."""
    age: int = Field(..., ge=0, le=150, description="Age in years")
    gender: str = Field(..., pattern="^(male|female|other)$")
    state: str = Field(..., min_length=2, max_length=5, description="State code, e.g. UP, MH")
    district: Optional[str] = Field(None, description="District name")
    occupation: str = Field(..., description="Primary occupation")
    annual_income: float = Field(..., ge=0, description="Annual income in INR")
    category: str = Field(..., pattern="^(general|obc|sc|st)$", description="Social category")
    disability: bool = Field(False, description="Person with disability status")
    is_student: bool = Field(False)
    is_farmer: bool = Field(False)
    is_woman: bool = Field(False)
    is_senior_citizen: bool = Field(False)
    is_bpl: bool = Field(False, description="Below Poverty Line status")
    land_holding_hectares: Optional[float] = Field(None, ge=0, description="Land in hectares, if farmer")
    language: str = Field("en", pattern="^(en|hi)$")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "age": 35,
                "gender": "male",
                "state": "UP",
                "district": "Lucknow",
                "occupation": "farmer",
                "annual_income": 120000,
                "category": "obc",
                "disability": False,
                "is_student": False,
                "is_farmer": True,
                "is_woman": False,
                "is_senior_citizen": False,
                "is_bpl": False,
                "land_holding_hectares": 1.5,
                "language": "en"
            }
        }
    )


class EligibleSchemeResult(BaseModel):
    """Single scheme in eligibility results."""
    id: str
    name: str
    name_hi: Optional[str] = None
    slug: str
    ministry: Optional[str] = None
    level: Optional[str] = None
    benefits: Optional[str] = None
    benefits_hi: Optional[str] = None
    benefits_amount: Optional[str] = None
    required_documents: list[str] = []
    application_url: Optional[str] = None
    helpline: Optional[str] = None
    deadline: Optional[str] = None
    scheme_type: list[str] = []
    category_name: Optional[str] = None
    category_icon: Optional[str] = None

    # Eligibility scoring
    match_score: float = Field(..., description="0.0 to 1.0 — how well the user matches")
    rules_matched: int = 0
    rules_total: int = 0
    ai_explanation: Optional[str] = None


class EligibilityResponse(BaseModel):
    """Response from eligibility check."""
    total_schemes_checked: int
    eligible_count: int
    schemes: list[EligibleSchemeResult]
    profile_summary: str
    ai_summary: Optional[str] = None
