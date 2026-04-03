from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, Enum, ForeignKey, Text, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .db import Base


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class ZoneEnum(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"

class TierEnum(str, enum.Enum):
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"

class RiskCategoryEnum(str, enum.Enum):
    LOW       = "LOW"
    MEDIUM    = "MEDIUM"
    HIGH      = "HIGH"
    VERY_HIGH = "VERY_HIGH"

class ClaimStatusEnum(str, enum.Enum):
    MONITORING    = "monitoring"
    PAYOUT_READY  = "payout_ready"
    MANUAL_REVIEW = "manual_review"
    CLOSED        = "closed"
    REJECTED      = "rejected"

class PlatformEnum(str, enum.Enum):
    SWIGGY  = "swiggy"
    ZOMATO  = "zomato"
    DUNZO   = "dunzo"
    BLINKIT = "blinkit"
    OTHER   = "other"

class WorkShiftEnum(str, enum.Enum):
    MORNING   = "morning"
    AFTERNOON = "afternoon"
    NIGHT     = "night"


# ─────────────────────────────────────────────
# 1. USER
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=False)
    platform         = Column(Enum(PlatformEnum), nullable=False)
    region           = Column(String, nullable=False)
    income           = Column(Integer, nullable=False)   # declared weekly income ₹
    upi_id           = Column(String, nullable=True)     # for payout disbursement
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    profile       = relationship("WorkerProfile",  back_populates="user", uselist=False)
    policies      = relationship("Policy",         back_populates="user")
    claims        = relationship("Claim",          back_populates="user")
    risk_scores   = relationship("RiskScore",      back_populates="user")
    payouts       = relationship("Payout",         back_populates="user")
    smartwork     = relationship("SmartWorkTip",   back_populates="user")
    income_logs   = relationship("DailyIncomeLog", back_populates="user")
    fraud_signals = relationship("FraudSignal",    back_populates="user")


# ─────────────────────────────────────────────
# 2. WORKER PROFILE
# ─────────────────────────────────────────────

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    zone              = Column(Enum(ZoneEnum), nullable=False)
    tier              = Column(Enum(TierEnum), nullable=False)
    pincode           = Column(String(10), nullable=False)
    avg_weekly_hours  = Column(Float, nullable=False, default=0.0)
    avg_weekly_income = Column(Float, nullable=False, default=0.0)
    avg_daily_income  = Column(Float, nullable=False, default=0.0)
    primary_shift     = Column(Enum(WorkShiftEnum), default=WorkShiftEnum.AFTERNOON)
    is_multi_platform = Column(Boolean, default=False)
    weekly_coverage   = Column(Float, nullable=False, default=0.0)
    weekly_premium    = Column(Float, nullable=False, default=0.0)
    last_updated      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")


# ─────────────────────────────────────────────
# 3. RISK SCORE
# ─────────────────────────────────────────────

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date  = Column(Date, nullable=False)
    zone_score       = Column(Integer, nullable=False)
    pincode_score    = Column(Integer, nullable=False)
    hours_score      = Column(Integer, nullable=False)
    shift_score      = Column(Integer, nullable=False)
    claim_score      = Column(Integer, nullable=False)
    total_score      = Column(Float, nullable=False)
    risk_category    = Column(Enum(RiskCategoryEnum), nullable=False)
    multiplier       = Column(Float, nullable=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="risk_scores")


# ─────────────────────────────────────────────
# 4. POLICY
# ─────────────────────────────────────────────

class Policy(Base):
    __tablename__ = "policies"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date  = Column(Date, nullable=False)
    week_end_date    = Column(Date, nullable=False)
    zone             = Column(Enum(ZoneEnum), nullable=False)
    tier             = Column(Enum(TierEnum), nullable=False)
    weekly_coverage  = Column(Float, nullable=False)
    weekly_premium   = Column(Float, nullable=False)
    is_paid          = Column(Boolean, default=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user   = relationship("User",   back_populates="policies")
    claims = relationship("Claim",  back_populates="policy")


# ─────────────────────────────────────────────
# 5. IMD TRIGGER EVENT
# ─────────────────────────────────────────────

class IMDTriggerEvent(Base):
    __tablename__ = "imd_trigger_events"

    id              = Column(Integer, primary_key=True, index=True)
    district        = Column(String, nullable=False)
    pincode         = Column(String(10), nullable=True)
    alert_color     = Column(String(10), nullable=False)
    zone_triggered  = Column(Enum(ZoneEnum), nullable=False)
    triggered_at    = Column(DateTime(timezone=True), server_default=func.now())
    is_deduplicated = Column(Boolean, default=False)

    claims = relationship("Claim", back_populates="trigger_event")


# ─────────────────────────────────────────────
# 6. CLAIM
# ─────────────────────────────────────────────

class Claim(Base):
    __tablename__ = "claims"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id        = Column(Integer, ForeignKey("policies.id"), nullable=False)
    trigger_event_id = Column(Integer, ForeignKey("imd_trigger_events.id"), nullable=False)
    status           = Column(Enum(ClaimStatusEnum), default=ClaimStatusEnum.MONITORING, nullable=False)
    loss_counter     = Column(Integer, default=0)
    monitoring_start = Column(Date, nullable=False)
    monitoring_end   = Column(Date, nullable=True)
    days_of_loss     = Column(Integer, nullable=True)
    payout_percentage = Column(Float, nullable=True)
    payout_amount    = Column(Float, nullable=True)
    fraud_probability = Column(Float, nullable=True)
    is_fraud_flagged = Column(Boolean, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    user          = relationship("User",            back_populates="claims")
    policy        = relationship("Policy",          back_populates="claims")
    trigger_event = relationship("IMDTriggerEvent", back_populates="claims")
    income_logs   = relationship("DailyIncomeLog",  back_populates="claim")
    payout        = relationship("Payout",          back_populates="claim", uselist=False)
    fraud_signals = relationship("FraudSignal",     back_populates="claim")


# ─────────────────────────────────────────────
# 7. DAILY INCOME LOG
# ─────────────────────────────────────────────

class DailyIncomeLog(Base):
    __tablename__ = "daily_income_logs"

    id                 = Column(Integer, primary_key=True, index=True)
    claim_id           = Column(Integer, ForeignKey("claims.id"), nullable=False)
    user_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date           = Column(Date, nullable=False)
    income_earned      = Column(Float, nullable=False)
    baseline_income    = Column(Float, nullable=False)
    is_below_threshold = Column(Boolean, nullable=False)
    platform_logged_in = Column(Boolean, nullable=False)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="income_logs")
    user  = relationship("User",  back_populates="income_logs")


# ─────────────────────────────────────────────
# 8. PAYOUT
# ─────────────────────────────────────────────

class Payout(Base):
    __tablename__ = "payouts"

    id                = Column(Integer, primary_key=True, index=True)
    claim_id          = Column(Integer, ForeignKey("claims.id"), unique=True, nullable=False)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount            = Column(Float, nullable=False)
    upi_id            = Column(String, nullable=False)
    transaction_id    = Column(String, unique=True, nullable=True)
    is_sent           = Column(Boolean, default=False)
    sent_at           = Column(DateTime(timezone=True), nullable=True)
    trigger_date      = Column(Date, nullable=False)
    alert_level       = Column(String(10), nullable=False)
    days_of_loss      = Column(Integer, nullable=False)
    payout_percentage = Column(Float, nullable=False)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="payout")
    user  = relationship("User",  back_populates="payouts")


# ─────────────────────────────────────────────
# 9. FRAUD SIGNAL
# ─────────────────────────────────────────────

class FraudSignal(Base):
    __tablename__ = "fraud_signals"

    id                           = Column(Integer, primary_key=True, index=True)
    claim_id                     = Column(Integer, ForeignKey("claims.id"), nullable=False)
    user_id                      = Column(Integer, ForeignKey("users.id"), nullable=False)
    layer_1_event_verification   = Column(Float, default=0.0)
    layer_2_weather_baseline     = Column(Float, default=0.0)
    layer_3_worker_behaviour     = Column(Float, default=0.0)
    layer_4_platform_activity    = Column(Float, default=0.0)
    layer_5_income_pattern       = Column(Float, default=0.0)
    layer_6_zone_correlation     = Column(Float, default=0.0)
    layer_7_neighboring_zone     = Column(Float, default=0.0)
    layer_8_behavioral_deviation = Column(Float, default=0.0)
    fraud_probability            = Column(Float, nullable=False)
    is_fraud_ring_flagged        = Column(Boolean, default=False)
    cluster_risk_score           = Column(Float, nullable=True)
    decision                     = Column(String(20), nullable=False)
    evaluated_at                 = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="fraud_signals")
    user  = relationship("User",  back_populates="fraud_signals")


# ─────────────────────────────────────────────
# 10. SMARTWORK TIP
# ─────────────────────────────────────────────

class SmartWorkTip(Base):
    __tablename__ = "smartwork_tips"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date      = Column(Date, nullable=False)
    best_time_slots      = Column(Text, nullable=True)
    best_zones           = Column(Text, nullable=True)
    weather_window       = Column(Text, nullable=True)
    surge_alerts         = Column(Text, nullable=True)
    risk_advisory        = Column(Text, nullable=True)
    projected_earnings   = Column(Float, nullable=True)
    actual_earnings      = Column(Float, nullable=True)
    followed_safety_tips = Column(Boolean, nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="smartwork")
