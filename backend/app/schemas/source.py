"""
Government Source Validation and Serialization Schemas.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_CATEGORIES = [
    "Central Government",
    "State Government",
    "Ministry",
    "Department",
    "Portal",
    "RSS Feed",
    "Sitemap",
    "Manual Source"
]


class SourceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(...)
    website_url: str = Field(..., max_length=1000)
    rss_url: Optional[str] = Field(None, max_length=1000)
    sitemap_url: Optional[str] = Field(None, max_length=1000)
    state: Optional[str] = Field(None, max_length=100)
    ministry: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    priority: int = Field(1, ge=1, le=10)
    is_active: bool = True
    is_verified: bool = True
    notes: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return value

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str) -> str:
        if not value.startswith("https://"):
            raise ValueError("website_url must be an HTTPS URL (start with https://)")
        return value

    @field_validator("rss_url", "sitemap_url")
    @classmethod
    def validate_optional_urls(cls, value: Optional[str]) -> Optional[str]:
        if value and not value.startswith("https://"):
            raise ValueError("Optional URLs must be HTTPS URLs (start with https://)")
        return value


class SourceCreate(SourceBase):
    """Schema for creating a government source registry entry."""
    pass


class SourceUpdate(BaseModel):
    """Schema for updating a government source registry entry."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[str] = None
    website_url: Optional[str] = Field(None, max_length=1000)
    rss_url: Optional[str] = Field(None, max_length=1000)
    sitemap_url: Optional[str] = Field(None, max_length=1000)
    state: Optional[str] = Field(None, max_length=100)
    ministry: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    priority: Optional[int] = Field(None, ge=1, le=10)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return value

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.startswith("https://"):
            raise ValueError("website_url must be an HTTPS URL (start with https://)")
        return value

    @field_validator("rss_url", "sitemap_url")
    @classmethod
    def validate_optional_urls(cls, value: Optional[str]) -> Optional[str]:
        if value and not value.startswith("https://"):
            raise ValueError("Optional URLs must be HTTPS URLs (start with https://)")
        return value


class SourceDetail(SourceBase):
    """Schema for outputting a detailed government source record."""
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
