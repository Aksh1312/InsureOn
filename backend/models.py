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
    A = "A"  # High Risk   — Chennai, Mumbai, Kolkata
    B = "B"  # Moderate    — Bengaluru, Hyderabad, Ahmedabad
    C = "C"  # Low Risk    — Delhi, Pune, Jaipur

class TierEnum(str, enum.Enum):
    TIER_1 = "TIER_1"  # ₹1,500–₹4,500/week  — Part-time
    TIER_2 = "TIER_2"  # ₹4,501–₹8,000/week  — Regular
    TIER_3 = "TIER_3"  # ₹8,001–₹12,000+/week — Full-time

class RiskCategoryEnum(str, enum.Enum):
    LOW       = "LOW"        # Score 1.0–1.5 → multiplier 0.85x
    MEDIUM    = "MEDIUM"     # Score 1.6–2.0 → multiplier 1.00x
    HIGH      = "HIGH"       # Score 2.1–2.5 → multiplier 1.20x
    VERY_HIGH = "VERY_HIGH"  # Score 2.6–3.0 → multiplier 1.40x

class ClaimStatusEnum(str, enum.Enum):
    MONITORING    = "monitoring"     # Claim opened, watching income
    PAYOUT_READY  = "payout_ready"   # 5 consecutive loss days hit
    MANUAL_REVIEW = "manual_review"  # Fraud flag or Scenario C
    CLOSED        = "closed"         # Payout sent
    REJECTED      = "rejected"       # Scenario D or fraud detected

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


PLATFORM_ENUM_DB = Enum(
    PlatformEnum,
    name="platformenum",
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)


# ─────────────────────────────────────────────
# 1. USER  (your existing table — extended)
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    full_name        = Column(String, nullable=True)
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
#    Stores derived tier/zone + working pattern
# ─────────────────────────────────────────────

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Zone & Tier — auto-assigned each Monday
    zone                 = Column(Enum(ZoneEnum), nullable=False)
    tier                 = Column(Enum(TierEnum), nullable=False)
    pincode              = Column(String(10), nullable=False)

    # 4-week rolling averages — updated every Monday
    avg_weekly_hours     = Column(Float, nullable=False, default=0.0)
    avg_weekly_income    = Column(Float, nullable=False, default=0.0)  # ₹
    avg_daily_income     = Column(Float, nullable=False, default=0.0)  # baseline for claim trigger

    # Work pattern — used in risk scoring
    primary_shift        = Column(Enum(WorkShiftEnum), default=WorkShiftEnum.AFTERNOON)
    is_multi_platform    = Column(Boolean, default=False)

    # Coverage & Premium (calculated from tier + zone + risk score)
    weekly_coverage      = Column(Float, nullable=False, default=0.0)  # 70% of avg weekly income
    weekly_premium       = Column(Float, nullable=False, default=0.0)  # final premium after multiplier

    last_updated         = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    user = relationship("User", back_populates="profile")


# ─────────────────────────────────────────────
# 3. RISK SCORE
#    One record per worker per week
# ─────────────────────────────────────────────

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date = Column(Date, nullable=False)   # Monday of the scored week

    # Individual factor scores (1, 2, or 3)
    zone_score      = Column(Integer, nullable=False)   # weight 0.30
    pincode_score   = Column(Integer, nullable=False)   # weight 0.25
    hours_score     = Column(Integer, nullable=False)   # weight 0.20
    shift_score     = Column(Integer, nullable=False)   # weight 0.15
    claim_score     = Column(Integer, nullable=False)   # weight 0.10

    # Computed
    total_score     = Column(Float, nullable=False)     # 1.0–3.0
    risk_category   = Column(Enum(RiskCategoryEnum), nullable=False)
    multiplier      = Column(Float, nullable=False)     # 0.85 / 1.00 / 1.20 / 1.40

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user = relationship("User", back_populates="risk_scores")


# ─────────────────────────────────────────────
# 4. POLICY
#    One active policy per worker per week
# ─────────────────────────────────────────────

class Policy(Base):
    __tablename__ = "policies"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)

    week_start_date  = Column(Date, nullable=False)    # Monday
    week_end_date    = Column(Date, nullable=False)    # Sunday

    zone             = Column(Enum(ZoneEnum), nullable=False)
    tier             = Column(Enum(TierEnum), nullable=False)

    weekly_coverage  = Column(Float, nullable=False)   # ₹ — 70% of avg weekly income
    weekly_premium   = Column(Float, nullable=False)   # ₹ — final after risk multiplier
    is_paid          = Column(Boolean, default=False)
    is_active        = Column(Boolean, default=True)

    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user   = relationship("User",  back_populates="policies")
    claims = relationship("Claim", back_populates="policy")


# ─────────────────────────────────────────────
# 5. IMD TRIGGER EVENT
#    Logged when IMD Red/Orange alert fires
#    for a district — drives automatic claim opening
# ─────────────────────────────────────────────

class IMDTriggerEvent(Base):
    __tablename__ = "imd_trigger_events"

    id             = Column(Integer, primary_key=True, index=True)
    district       = Column(String, nullable=False)
    pincode        = Column(String(10), nullable=True)
    alert_color    = Column(String(10), nullable=False)   # "RED" or "ORANGE"
    zone_triggered = Column(Enum(ZoneEnum), nullable=False)
    triggered_at   = Column(DateTime(timezone=True), server_default=func.now())
    is_deduplicated = Column(Boolean, default=False)      # one trigger per district per day

    # relationships
    claims = relationship("Claim", back_populates="trigger_event")


# ─────────────────────────────────────────────
# 6. CLAIM
#    Auto-opened when IMD trigger fires
#    Status flows: monitoring → payout_ready → closed
#                               ↓
#                         manual_review / rejected
# ─────────────────────────────────────────────

class Claim(Base):
    __tablename__ = "claims"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id           = Column(Integer, ForeignKey("policies.id"), nullable=False)
    trigger_event_id    = Column(Integer, ForeignKey("imd_trigger_events.id"), nullable=False)

    status              = Column(Enum(ClaimStatusEnum), default=ClaimStatusEnum.MONITORING, nullable=False)
    loss_counter        = Column(Integer, default=0)      # consecutive days below 50% baseline
    monitoring_start    = Column(Date, nullable=False)    # day claim was opened
    monitoring_end      = Column(Date, nullable=True)     # day claim was resolved

    # Payout details (filled when status → payout_ready)
    days_of_loss        = Column(Integer, nullable=True)  # 5, 6, or 7
    payout_percentage   = Column(Float, nullable=True)    # 70%, 85%, or 100%
    payout_amount       = Column(Float, nullable=True)    # ₹ final amount

    # Fraud flag from fraud detection engine
    fraud_probability   = Column(Float, nullable=True)    # 0.0–1.0
    is_fraud_flagged    = Column(Boolean, default=False)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user          = relationship("User",           back_populates="claims")
    policy        = relationship("Policy",         back_populates="claims")
    trigger_event = relationship("IMDTriggerEvent", back_populates="claims")
    income_logs   = relationship("DailyIncomeLog", back_populates="claim")
    payout        = relationship("Payout",         back_populates="claim", uselist=False)
    fraud_signals = relationship("FraudSignal",    back_populates="claim")


# ─────────────────────────────────────────────
# 7. DAILY INCOME LOG
#    Pulled every midnight from platform API
#    Used to increment/reset the loss counter
# ─────────────────────────────────────────────

class DailyIncomeLog(Base):
    __tablename__ = "daily_income_logs"

    id                  = Column(Integer, primary_key=True, index=True)
    claim_id            = Column(Integer, ForeignKey("claims.id"), nullable=False)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)

    log_date            = Column(Date, nullable=False)
    income_earned       = Column(Float, nullable=False)       # ₹ earned that day
    baseline_income     = Column(Float, nullable=False)       # worker's avg daily baseline
    is_below_threshold  = Column(Boolean, nullable=False)     # True if earned < 50% of baseline
    platform_logged_in  = Column(Boolean, nullable=False)     # True if worker logged into app

    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    claim = relationship("Claim", back_populates="income_logs")
    user  = relationship("User", back_populates="income_logs")


# ─────────────────────────────────────────────
# 8. PAYOUT
#    Created when claim reaches payout_ready
#    Disbursed via UPI
# ─────────────────────────────────────────────

class Payout(Base):
    __tablename__ = "payouts"

    id               = Column(Integer, primary_key=True, index=True)
    claim_id         = Column(Integer, ForeignKey("claims.id"), unique=True, nullable=False)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)

    amount           = Column(Float, nullable=False)         # ₹ final disbursed
    upi_id           = Column(String, nullable=False)        # worker's UPI handle
    transaction_id   = Column(String, unique=True, nullable=True)  # from UPI gateway
    is_sent          = Column(Boolean, default=False)
    sent_at          = Column(DateTime(timezone=True), nullable=True)

    # Audit log fields (for reinsurer — GIC Re / Munich Re)
    trigger_date     = Column(Date, nullable=False)          # when disaster was detected
    alert_level      = Column(String(10), nullable=False)    # RED or ORANGE
    days_of_loss     = Column(Integer, nullable=False)       # 5, 6, or 7
    payout_percentage = Column(Float, nullable=False)        # 70 / 85 / 100

    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    claim = relationship("Claim", back_populates="payout")
    user  = relationship("User", back_populates="payouts")


# ─────────────────────────────────────────────
# 9. FRAUD SIGNAL
#    One record per layer per claim
#    All 8 layers stored individually
# ─────────────────────────────────────────────

class FraudSignal(Base):
    __tablename__ = "fraud_signals"

    id           = Column(Integer, primary_key=True, index=True)
    claim_id     = Column(Integer, ForeignKey("claims.id"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Layer scores (0.0 = clean, 1.0 = highly suspicious)
    layer_1_event_verification    = Column(Float, default=0.0)   # IMD event confirmed?
    layer_2_weather_baseline      = Column(Float, default=0.0)   # vs historical baseline
    layer_3_worker_behaviour      = Column(Float, default=0.0)   # claim history + activity
    layer_4_platform_activity     = Column(Float, default=0.0)   # login + delivery check
    layer_5_income_pattern        = Column(Float, default=0.0)   # gradual vs instant drop
    layer_6_zone_correlation      = Column(Float, default=0.0)   # vs zone-wide claim rate
    layer_7_neighboring_zone      = Column(Float, default=0.0)   # neighboring zone cross-check
    layer_8_behavioral_deviation  = Column(Float, default=0.0)   # vs worker's own fingerprint

    # Final logistic regression output
    fraud_probability             = Column(Float, nullable=False) # 0.0–1.0
    is_fraud_ring_flagged         = Column(Boolean, default=False)
    cluster_risk_score            = Column(Float, nullable=True)  # graph-based ring score

    # Decision
    # 0–0.20 → auto approve | 0.20–0.50 → fast review
    # 0.50–0.80 → manual    | 0.80+    → reject
    decision                      = Column(String(20), nullable=False)  # "auto_approve" / "fast_review" / "manual" / "reject"

    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    claim = relationship("Claim", back_populates="fraud_signals")
    user  = relationship("User", back_populates="fraud_signals")


# ─────────────────────────────────────────────
# 10. SMARTWORK TIP
#     Weekly tips generated per worker
# ─────────────────────────────────────────────

class SmartWorkTip(Base):
    __tablename__ = "smartwork_tips"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start_date = Column(Date, nullable=False)

    best_time_slots = Column(Text, nullable=True)    # JSON string — e.g. ["7PM-9PM weekdays"]
    best_zones      = Column(Text, nullable=True)    # JSON string — high earning zone names
    weather_window  = Column(Text, nullable=True)    # JSON string — safe working windows
    surge_alerts    = Column(Text, nullable=True)    # JSON string — festival/event surges
    risk_advisory   = Column(Text, nullable=True)    # plain text — IMD advisory if active

    # Impact tracking
    projected_earnings  = Column(Float, nullable=True)   # ₹ if tips followed
    actual_earnings     = Column(Float, nullable=True)   # ₹ filled at end of week
    followed_safety_tips = Column(Boolean, nullable=True) # did worker follow weather advice?

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user = relationship("User", back_populates="smartwork")