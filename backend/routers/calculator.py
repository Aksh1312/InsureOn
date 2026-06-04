from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from ..services.premium import (
    assign_zone, assign_tier, get_readme_band,
    calculate_coverage, calculate_base_premium,
)
from ..services.risk import estimate_risk_score
from ..models import ZoneEnum, TierEnum, RiskCategoryEnum, WorkShiftEnum

router = APIRouter(prefix="/calculator", tags=["Calculator"])


class CalculatorEstimateRequest(BaseModel):
    city: str
    weekly_hours: float
    weekly_income: float
    shift: Optional[str] = "afternoon"
    multi_platform: bool = False
    override_zone: Optional[str] = None
    override_tier: Optional[str] = None

    @field_validator("weekly_hours")
    def hours_must_be_valid(cls, v):
        if v < 10:
            raise ValueError("Weekly hours must be at least 10")
        return v

    @field_validator("weekly_income")
    def income_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Weekly income must be greater than Rs. 0")
        return v

    @field_validator("shift")
    def shift_must_be_valid(cls, v):
        if v is None:
            return "afternoon"
        allowed = {e.value for e in WorkShiftEnum}
        normalized = v.strip().lower()
        if normalized not in allowed:
            raise ValueError(f"Shift must be one of: {', '.join(sorted(allowed))}")
        return normalized

    @field_validator("override_zone")
    def zone_must_be_valid(cls, v):
        if v is not None:
            allowed = {e.value for e in ZoneEnum}
            normalized = v.strip().upper()
            if normalized not in allowed:
                raise ValueError(f"Zone must be one of: {', '.join(sorted(allowed))}")
            return normalized
        return v

    @field_validator("override_tier")
    def tier_must_be_valid(cls, v):
        if v is not None:
            allowed = {e.value for e in TierEnum}
            normalized = v.strip().upper()
            if normalized not in allowed:
                raise ValueError(f"Tier must be one of: {', '.join(sorted(allowed))}")
            return normalized
        return v


class CalculatorEstimateResponse(BaseModel):
    zone: str
    tier: str
    is_overridden: bool = False
    coverage_amount: float
    base_premium: float
    risk_category: str
    risk_score: float
    premium: float
    coverage_pct: float = 0.70


@router.post("/estimate", response_model=CalculatorEstimateResponse)
def estimate(body: CalculatorEstimateRequest):
    if body.override_zone:
        zone_val = body.override_zone
    else:
        zone_val = assign_zone(body.city).value

    if body.override_tier:
        tier_val = body.override_tier
    else:
        tier_val = assign_tier(body.weekly_hours).value

    is_overridden = bool(body.override_zone or body.override_tier)

    # Calculate coverage and base premium taking income into account when available
    coverage = calculate_coverage(body.weekly_hours, body.weekly_income)
    base_premium = calculate_base_premium(body.weekly_hours, zone_val, body.weekly_income)

    risk_category, risk_mult, risk_score = estimate_risk_score(
        zone=zone_val,
        hours=body.weekly_hours,
        shift=body.shift or "afternoon",
    )

    return CalculatorEstimateResponse(
        zone=zone_val,
        tier=tier_val,
        is_overridden=is_overridden,
        coverage_amount=coverage,
        base_premium=base_premium,
        risk_category=risk_category.value,
        risk_score=risk_score,
        premium=base_premium,
    )
