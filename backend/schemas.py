from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from .models import (
    ZoneEnum, TierEnum, RiskCategoryEnum,
    ClaimStatusEnum, PlatformEnum, WorkShiftEnum
)


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    platform: PlatformEnum
    region: str
    income: int           # weekly income in ₹
    pincode: str
    upi_id: str

    @field_validator("income")
    def income_must_be_positive(cls, v):
        if v < 1500:
            raise ValueError("Weekly income must be at least ₹1,500")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    platform: PlatformEnum
    region: str
    income: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# WORKER PROFILE
# ─────────────────────────────────────────────

class WorkerProfileOut(BaseModel):
    id: int
    user_id: int
    zone: ZoneEnum
    tier: TierEnum
    pincode: str
    avg_weekly_hours: float
    avg_weekly_income: float
    avg_daily_income: float
    primary_shift: WorkShiftEnum
    is_multi_platform: bool
    weekly_coverage: float
    weekly_premium: float
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

class WorkerProfileUpdate(BaseModel):
    avg_weekly_hours: Optional[float] = None
    avg_weekly_income: Optional[float] = None
    primary_shift: Optional[WorkShiftEnum] = None
    is_multi_platform: Optional[bool] = None


# ─────────────────────────────────────────────
# RISK SCORE
# ─────────────────────────────────────────────

class RiskScoreOut(BaseModel):
    id: int
    user_id: int
    week_start_date: date
    zone_score: int
    pincode_score: int
    hours_score: int
    shift_score: int
    claim_score: int
    total_score: float
    risk_category: RiskCategoryEnum
    multiplier: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# POLICY
# ─────────────────────────────────────────────

class PolicyOut(BaseModel):
    id: int
    user_id: int
    week_start_date: date
    week_end_date: date
    zone: ZoneEnum
    tier: TierEnum
    weekly_coverage: float
    weekly_premium: float
    is_paid: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# IMD TRIGGER
# ─────────────────────────────────────────────

class IMDTriggerOut(BaseModel):
    id: int
    district: str
    alert_color: str
    zone_triggered: ZoneEnum
    triggered_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# CLAIM
# ─────────────────────────────────────────────

class ClaimOut(BaseModel):
    id: int
    user_id: int
    policy_id: int
    trigger_event_id: int
    status: ClaimStatusEnum
    loss_counter: int
    monitoring_start: date
    monitoring_end: Optional[date]
    days_of_loss: Optional[int]
    payout_percentage: Optional[float]
    payout_amount: Optional[float]
    fraud_probability: Optional[float]
    is_fraud_flagged: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# DAILY INCOME LOG
# ─────────────────────────────────────────────

class DailyIncomeLogCreate(BaseModel):
    claim_id: int
    user_id: int
    log_date: date
    income_earned: float
    baseline_income: float
    platform_logged_in: bool

class DailyIncomeLogOut(BaseModel):
    id: int
    claim_id: int
    log_date: date
    income_earned: float
    baseline_income: float
    is_below_threshold: bool
    platform_logged_in: bool

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# PAYOUT
# ─────────────────────────────────────────────

class PayoutOut(BaseModel):
    id: int
    claim_id: int
    user_id: int
    amount: float
    upi_id: str
    transaction_id: Optional[str]
    is_sent: bool
    sent_at: Optional[datetime]
    trigger_date: date
    alert_level: str
    days_of_loss: int
    payout_percentage: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# FRAUD SIGNAL
# ─────────────────────────────────────────────

class FraudSignalOut(BaseModel):
    id: int
    claim_id: int
    layer_1_event_verification: float
    layer_2_weather_baseline: float
    layer_3_worker_behaviour: float
    layer_4_platform_activity: float
    layer_5_income_pattern: float
    layer_6_zone_correlation: float
    layer_7_neighboring_zone: float
    layer_8_behavioral_deviation: float
    fraud_probability: float
    is_fraud_ring_flagged: bool
    cluster_risk_score: Optional[float]
    decision: str
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# SMARTWORK
# ─────────────────────────────────────────────

class SmartWorkTipOut(BaseModel):
    id: int
    user_id: int
    week_start_date: date
    best_time_slots: Optional[str]
    best_zones: Optional[str]
    weather_window: Optional[str]
    surge_alerts: Optional[str]
    risk_advisory: Optional[str]
    projected_earnings: Optional[float]
    actual_earnings: Optional[float]
    followed_safety_tips: Optional[bool]

    model_config = ConfigDict(from_attributes=True)

class SmartWorkActualUpdate(BaseModel):
    actual_earnings: float
    followed_safety_tips: bool


# ─────────────────────────────────────────────
# SIMULATION TESTING
# ─────────────────────────────────────────────

class SimTriggerRequest(BaseModel):
    district: str
    zone: ZoneEnum
    alert_color: str = "RED"


class SimTriggerResponse(BaseModel):
    district: str
    zone: ZoneEnum
    alert_color: str
    claims_opened: int


class SimMonitoringProcessResponse(BaseModel):
    processed: int
    status_counts: dict[str, int]
    results: list[dict]
