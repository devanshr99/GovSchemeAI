"""
Crawler Extractions Serialization Schemas.
"""

from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ExtractionDetail(BaseModel):
    """Schema for serialization outputs of crawl page extraction records."""
    id: str
    queue_item_id: str
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    validation_report: Dict[str, Any] = Field(default_factory=dict)
    duplicate_report: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
