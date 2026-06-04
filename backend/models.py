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
    SYSTEM  = "system"

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
    is_admin         = Column(Boolean, default=False)       # admin access for operations dashboard
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
    district       = Column(String, nullable=False, index=True)
    pincode        = Column(String(10), nullable=True)
    alert_color    = Column(String(10), nullable=False)
    zone_triggered = Column(Enum(ZoneEnum), nullable=False)
    triggered_at   = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    is_deduplicated = Column(Boolean, default=False)

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
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    policy_id           = Column(Integer, ForeignKey("policies.id"), nullable=False)
    trigger_event_id    = Column(Integer, ForeignKey("imd_trigger_events.id"), nullable=False)

    status              = Column(Enum(ClaimStatusEnum), default=ClaimStatusEnum.MONITORING, nullable=False, index=True)
    loss_counter        = Column(Integer, default=0)
    monitoring_start    = Column(Date, nullable=False, index=True)
    monitoring_end      = Column(Date, nullable=True)

    days_of_loss        = Column(Integer, nullable=True)
    payout_percentage   = Column(Float, nullable=True)
    payout_amount       = Column(Float, nullable=True)

    fraud_probability   = Column(Float, nullable=True)
    is_fraud_flagged    = Column(Boolean, default=False, index=True)

    created_at          = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user          = relationship("User",           back_populates="claims")
    policy        = relationship("Policy",         back_populates="claims")
    trigger_event = relationship("IMDTriggerEvent", back_populates="claims")
    income_logs   = relationship("DailyIncomeLog", back_populates="claim")
    payout        = relationship("Payout",         back_populates="claim", uselist=False)
    fraud_signals = relationship("FraudSignal",    back_populates="claim")

    @property
    def alert_level(self) -> str:
        return self.trigger_event.alert_color if self.trigger_event else "RED"

    @property
    def alert_name(self) -> str:
        return f"{self.trigger_event.district} {self.trigger_event.alert_color} Alert" if self.trigger_event else "Weather Alert"

    @property
    def zone(self) -> str:
        if self.policy and self.policy.zone:
            return self.policy.zone.value if hasattr(self.policy.zone, 'value') else str(self.policy.zone)
        return "A"

    @property
    def resolved(self) -> bool:
        return self.status in [ClaimStatusEnum.CLOSED, ClaimStatusEnum.REJECTED]

    @property
    def claim_amount(self) -> float:
        return self.payout_amount if self.payout_amount else 0.0

    @property
    def is_payout_cancelled(self) -> bool:
        return self.status == ClaimStatusEnum.REJECTED


# ─────────────────────────────────────────────
# 7. DAILY INCOME LOG
#    Pulled every midnight from platform API
#    Used to increment/reset the loss counter
# ─────────────────────────────────────────────

class DailyIncomeLog(Base):
    __tablename__ = "daily_income_logs"

    id                  = Column(Integer, primary_key=True, index=True)
    claim_id            = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    log_date            = Column(Date, nullable=False, index=True)
    income_earned       = Column(Float, nullable=False)
    baseline_income     = Column(Float, nullable=False)
    is_below_threshold  = Column(Boolean, nullable=False)
    platform_logged_in  = Column(Boolean, nullable=False)

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
    claim_id         = Column(Integer, ForeignKey("claims.id"), unique=True, nullable=False, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    amount           = Column(Float, nullable=False)
    upi_id           = Column(String, nullable=False)
    transaction_id   = Column(String, unique=True, nullable=True)
    is_sent          = Column(Boolean, default=False, index=True)
    sent_at          = Column(DateTime(timezone=True), nullable=True)

    trigger_date     = Column(Date, nullable=False, index=True)
    alert_level      = Column(String(10), nullable=False)
    days_of_loss     = Column(Integer, nullable=False)
    payout_percentage = Column(Float, nullable=False)

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
    claim_id     = Column(Integer, ForeignKey("claims.id"), nullable=False, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

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

    # SmartWork Report fields
    projected_earnings   = Column(Float, nullable=True)   # ₹ if tips followed
    actual_earnings      = Column(Float, nullable=True)   # ₹ filled at end of week
    followed_safety_tips  = Column(Boolean, nullable=True) # did worker follow weather advice?

    recommended_slots    = Column(Text, nullable=True)    # JSON — enriched time slots with demand levels
    risk_outlook         = Column(Text, nullable=True)    # JSON — { category, warning, advice }
    premium_projection   = Column(Text, nullable=True)    # JSON — { current, projected, impact }
    city_insights        = Column(Text, nullable=True)    # JSON — { demand_trend, weather_risk, peak_day, description }
    confidence_score     = Column(Float, nullable=True)   # 0.0–1.0 confidence in recommendations

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user = relationship("User", back_populates="smartwork")


class NotificationType(str, enum.Enum):
    POLICY_CREATED  = "POLICY_CREATED"
    POLICY_RENEWED  = "POLICY_RENEWED"
    PREMIUM_PAID    = "PREMIUM_PAID"
    CLAIM_OPENED    = "CLAIM_OPENED"
    CLAIM_REJECTED  = "CLAIM_REJECTED"
    CLAIM_APPROVED  = "CLAIM_APPROVED"
    FRAUD_REVIEW    = "FRAUD_REVIEW"
    PAYOUT_SENT     = "PAYOUT_SENT"
    SMARTWORK_ALERT = "SMARTWORK_ALERT"
    WEATHER_ALERT   = "WEATHER_ALERT"
    SYSTEM          = "SYSTEM"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title      = Column(String(200), nullable=False)
    message    = Column(String(500), nullable=False)
    type       = Column(Enum(NotificationType), nullable=False)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata_json = Column(Text, nullable=True)

    user = relationship("User", backref="notifications")


class TransactionType(str, enum.Enum):
    PREMIUM_PAYMENT = "PREMIUM_PAYMENT"
    CLAIM_PAYOUT    = "CLAIM_PAYOUT"
    POLICY_RENEWAL  = "POLICY_RENEWAL"
    REFUND          = "REFUND"
    ADJUSTMENT      = "ADJUSTMENT"


class TransactionStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED  = "FAILED"


class Transaction(Base):
    __tablename__ = "transactions"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount           = Column(Float, nullable=False)
    status           = Column(Enum(TransactionStatus), nullable=False, default=TransactionStatus.SUCCESS)
    reference_id     = Column(String, nullable=True)
    description      = Column(String(300), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="transactions")