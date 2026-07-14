"""
Scheme listing/detail response schemas.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class SchemeCard(BaseModel):
    """Compact scheme representation for lists/grids."""
    id: str
    name: str
    name_hi: Optional[str] = None
    slug: str
    ministry: Optional[str] = None
    level: Optional[str] = None
    state_code: Optional[str] = None
    benefits_amount: Optional[str] = None
    scheme_type: list[str] = []
    tags: list[str] = []
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    is_active: bool = True


class SchemeDetail(SchemeCard):
    """Full scheme detail for individual page."""
    description: Optional[str] = None
    description_hi: Optional[str] = None
    benefits: Optional[str] = None
    benefits_hi: Optional[str] = None
    required_documents: list[str] = []
    application_process: Optional[str] = None
    application_process_hi: Optional[str] = None
    application_url: Optional[str] = None
    official_website: Optional[str] = None
    helpline: Optional[str] = None
    deadline: Optional[str] = None
    launched_date: Optional[str] = None
    eligibility_rules_summary: list[str] = []

    # Scheme Intelligence attributes
    status: Optional[str] = None
    last_seen: Optional[datetime] = None
    last_checked: Optional[datetime] = None
    version: Optional[int] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    updated_at: Optional[datetime] = None

    # UI fields
    ai_summary: Optional[str] = None
    related_schemes: list[SchemeCard] = []
    similar_schemes: list[SchemeCard] = []


class SchemeListResponse(BaseModel):
    """Paginated scheme list."""
    total: int
    page: int
    page_size: int
    schemes: list[SchemeCard]
