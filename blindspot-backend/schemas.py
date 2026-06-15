"""
Shared Pydantic v2 models for request/response validation.

These mirror the frontend <-> backend API contract (see API_CONTRACT.md).
Kept in one place so routers and agents share a single source of truth.
"""
from typing import List, Optional

from pydantic import BaseModel, Field


class Assumptions(BaseModel):
    """User's financial assumptions from the Input Matrix."""

    expected_rent: float = Field(..., description="Expected monthly rent, in local currency")
    savings_rate: float = Field(..., description="Expected savings rate, as a percentage (0-100)")
    confidence: int = Field(..., ge=0, le=100, description="User confidence in the plan (0-100)")


class AnalyzeRequest(BaseModel):
    """Body for POST /api/analyze."""

    session_id: str
    decision_text: str
    user_persona: str = Field(..., description="e.g. 'student', 'professional', 'freelancer'")
    origin_city: Optional[str] = None  # optional: only for relocation decisions
    destination_city: Optional[str] = None
    assumptions: Assumptions
    alternative_text: str
    values_rank: List[str] = Field(
        ..., description="Forced rank, e.g. ['financial', 'growth', 'balance', 'roots']"
    )
