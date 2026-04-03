from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime, timedelta
from typing import Optional
from . import models


# ─────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, email: str, hashed_password: str,
                platform: str, region: str, income: int) -> models.User:
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        platform=platform,
        region=region,
        income=income,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ─────────────────────────────────────────────
# WORKER PROFILE
# ─────────────────────────────────────────────

def get_worker_profile(db: Session, user_id: int) -> Optional[models.WorkerProfile]:
    return db.query(models.WorkerProfile).filter(
        models.WorkerProfile.user_id == user_id
    ).first()

def create_worker_profile(
    db: Session,
    user_id: int,
    zone: str,
    tier: str,
    pincode: str,
    avg_weekly_hours: float,
    avg_weekly_income: float,
    avg_daily_income: float,
    primary_shift: str,
    is_multi_platform: bool,
    weekly_coverage: float,
    weekly_premium: float,
) -> models.WorkerProfile:
    profile = models.WorkerProfile(
        user_id=user_id,
        zone=zone,
        tier=tier,
        pincode=pincode,
        avg_weekly_hours=avg_weekly_hours,
        avg_weekly_income=avg_weekly_income,
        avg_daily_income=avg_daily_income,
        primary_shift=primary_shift,
        is_multi_platform=is_multi_platform,
        weekly_coverage=weekly_coverage,
        weekly_premium=weekly_premium,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def update_worker_profile(db: Session, user_id: int, **kwargs) -> Optional[models.WorkerProfile]:
    profile = get_worker_profile(db, user_id)
    if not profile:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


# ─────────────────────────────────────────────
# RISK SCORE
# ─────────────────────────────────────────────

def create_risk_score(
    db: Session,
    user_id: int,
    week_start_date: date,
    zone_score: int,
    pincode_score: int,
    hours_score: int,
    shift_score: int,
    claim_score: int,
    total_score: float,
    risk_category: str,
    multiplier: float,
) -> models.RiskScore:
    risk = models.RiskScore(
        user_id=user_id,
        week_start_date=week_start_date,
        zone_score=zone_score,
        pincode_score=pincode_score,
        hours_score=hours_score,
        shift_score=shift_score,
        claim_score=claim_score,
        total_score=total_score,
        risk_category=risk_category,
        multiplier=multiplier,
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk

def get_latest_risk_score(db: Session, user_id: int) -> Optional[models.RiskScore]:
    return db.query(models.RiskScore).filter(
        models.RiskScore.user_id == user_id
    ).order_by(desc(models.RiskScore.week_start_date)).first()

def get_risk_score_history(db: Session, user_id: int) -> list:
    return db.query(models.RiskScore).filter(
        models.RiskScore.user_id == user_id
    ).order_by(desc(models.RiskScore.week_start_date)).all()


# ─────────────────────────────────────────────
# POLICY
# ─────────────────────────────────────────────

def create_policy(
    db: Session,
    user_id: int,
    week_start_date: date,
    zone: str,
    tier: str,
    weekly_coverage: float,
    weekly_premium: float,
) -> models.Policy:
    policy = models.Policy(
        user_id=user_id,
        week_start_date=week_start_date,
        week_end_date=week_start_date + timedelta(days=6),
        zone=zone,
        tier=tier,
        weekly_coverage=weekly_coverage,
        weekly_premium=weekly_premium,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

def get_active_policy(db: Session, user_id: int) -> Optional[models.Policy]:
    today = date.today()
    return db.query(models.Policy).filter(
        models.Policy.user_id == user_id,
        models.Policy.is_active == True,
        models.Policy.is_paid == True,
        models.Policy.week_start_date <= today,
        models.Policy.week_end_date >= today,
    ).first()

def mark_policy_paid(db: Session, policy_id: int) -> Optional[models.Policy]:
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if policy:
        policy.is_paid = True
        db.commit()
        db.refresh(policy)
    return policy

def get_policy_history(db: Session, user_id: int) -> list:
    return db.query(models.Policy).filter(
        models.Policy.user_id == user_id
    ).order_by(desc(models.Policy.week_start_date)).all()


# ─────────────────────────────────────────────
# IMD TRIGGER EVENT
# ─────────────────────────────────────────────

def create_imd_trigger(
    db: Session,
    district: str,
    alert_color: str,
    zone_triggered: str,
    pincode: Optional[str] = None,
) -> models.IMDTriggerEvent:
    trigger = models.IMDTriggerEvent(
        district=district,
        alert_color=alert_color,
        zone_triggered=zone_triggered,
        pincode=pincode,
    )
    db.add(trigger)
    db.commit()
    db.refresh(trigger)
    return trigger

def get_trigger_today(db: Session, district: str) -> Optional[models.IMDTriggerEvent]:
    today = date.today()
    return db.query(models.IMDTriggerEvent).filter(
        models.IMDTriggerEvent.district == district,
        models.IMDTriggerEvent.triggered_at >= datetime.combine(today, datetime.min.time()),
        models.IMDTriggerEvent.is_deduplicated == False,
    ).first()


# ─────────────────────────────────────────────
# CLAIM
# ─────────────────────────────────────────────

def create_claim(
    db: Session,
    user_id: int,
    policy_id: int,
    trigger_event_id: int,
) -> models.Claim:
    claim = models.Claim(
        user_id=user_id,
        policy_id=policy_id,
        trigger_event_id=trigger_event_id,
        status=models.ClaimStatusEnum.MONITORING,
        loss_counter=0,
        monitoring_start=date.today(),
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim

def get_active_claim(db: Session, user_id: int) -> Optional[models.Claim]:
    return db.query(models.Claim).filter(
        models.Claim.user_id == user_id,
        models.Claim.status == models.ClaimStatusEnum.MONITORING,
    ).first()

def get_claim_by_id(db: Session, claim_id: int) -> Optional[models.Claim]:
    return db.query(models.Claim).filter(models.Claim.id == claim_id).first()

def get_claims_by_user(db: Session, user_id: int) -> list:
    return db.query(models.Claim).filter(
        models.Claim.user_id == user_id
    ).order_by(desc(models.Claim.created_at)).all()

def increment_loss_counter(db: Session, claim_id: int) -> Optional[models.Claim]:
    claim = get_claim_by_id(db, claim_id)
    if claim:
        claim.loss_counter += 1
        if claim.loss_counter >= 5:
            claim.status = models.ClaimStatusEnum.PAYOUT_READY
            claim.days_of_loss = claim.loss_counter
            # 5 days → 70%, 6 days → 85%, 7 days → 100%
            pct_map = {5: 70.0, 6: 85.0, 7: 100.0}
            claim.payout_percentage = pct_map.get(min(claim.loss_counter, 7), 100.0)
        db.commit()
        db.refresh(claim)
    return claim

def reset_loss_counter(db: Session, claim_id: int) -> Optional[models.Claim]:
    claim = get_claim_by_id(db, claim_id)
    if claim:
        claim.loss_counter = 0
        db.commit()
        db.refresh(claim)
    return claim

def update_claim_status(
    db: Session, claim_id: int, status: models.ClaimStatusEnum
) -> Optional[models.Claim]:
    claim = get_claim_by_id(db, claim_id)
    if claim:
        claim.status = status
        if status in (
            models.ClaimStatusEnum.CLOSED,
            models.ClaimStatusEnum.REJECTED,
            models.ClaimStatusEnum.MANUAL_REVIEW,
        ):
            claim.monitoring_end = date.today()
        db.commit()
        db.refresh(claim)
    return claim


# ─────────────────────────────────────────────
# DAILY INCOME LOG
# ─────────────────────────────────────────────

def create_daily_income_log(
    db: Session,
    claim_id: int,
    user_id: int,
    log_date: date,
    income_earned: float,
    baseline_income: float,
    platform_logged_in: bool,
) -> models.DailyIncomeLog:
    is_below = income_earned < (baseline_income * 0.50)
    log = models.DailyIncomeLog(
        claim_id=claim_id,
        user_id=user_id,
        log_date=log_date,
        income_earned=income_earned,
        baseline_income=baseline_income,
        is_below_threshold=is_below,
        platform_logged_in=platform_logged_in,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_income_logs_for_claim(db: Session, claim_id: int) -> list:
    return db.query(models.DailyIncomeLog).filter(
        models.DailyIncomeLog.claim_id == claim_id
    ).order_by(models.DailyIncomeLog.log_date).all()


# ─────────────────────────────────────────────
# PAYOUT
# ─────────────────────────────────────────────

def create_payout(
    db: Session,
    claim_id: int,
    user_id: int,
    amount: float,
    upi_id: str,
    trigger_date: date,
    alert_level: str,
    days_of_loss: int,
    payout_percentage: float,
) -> models.Payout:
    payout = models.Payout(
        claim_id=claim_id,
        user_id=user_id,
        amount=amount,
        upi_id=upi_id,
        trigger_date=trigger_date,
        alert_level=alert_level,
        days_of_loss=days_of_loss,
        payout_percentage=payout_percentage,
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)
    return payout

def mark_payout_sent(
    db: Session, payout_id: int, transaction_id: str
) -> Optional[models.Payout]:
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if payout:
        payout.is_sent = True
        payout.sent_at = datetime.utcnow()
        payout.transaction_id = transaction_id
        db.commit()
        db.refresh(payout)
    return payout

def get_payout_by_claim(db: Session, claim_id: int) -> Optional[models.Payout]:
    return db.query(models.Payout).filter(
        models.Payout.claim_id == claim_id
    ).first()


# ─────────────────────────────────────────────
# FRAUD SIGNAL
# ─────────────────────────────────────────────

def create_fraud_signal(db: Session, claim_id: int, user_id: int, **kwargs) -> models.FraudSignal:
    signal = models.FraudSignal(claim_id=claim_id, user_id=user_id, **kwargs)
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal

def get_fraud_signal_by_claim(db: Session, claim_id: int) -> Optional[models.FraudSignal]:
    return db.query(models.FraudSignal).filter(
        models.FraudSignal.claim_id == claim_id
    ).first()


# ─────────────────────────────────────────────
# SMARTWORK TIPS
# ─────────────────────────────────────────────

def create_smartwork_tip(
    db: Session,
    user_id: int,
    week_start_date: date,
    best_time_slots: str,
    best_zones: str,
    weather_window: str,
    surge_alerts: str,
    risk_advisory: str,
    projected_earnings: float,
) -> models.SmartWorkTip:
    tip = models.SmartWorkTip(
        user_id=user_id,
        week_start_date=week_start_date,
        best_time_slots=best_time_slots,
        best_zones=best_zones,
        weather_window=weather_window,
        surge_alerts=surge_alerts,
        risk_advisory=risk_advisory,
        projected_earnings=projected_earnings,
    )
    db.add(tip)
    db.commit()
    db.refresh(tip)
    return tip

def get_latest_smartwork_tip(db: Session, user_id: int) -> Optional[models.SmartWorkTip]:
    return db.query(models.SmartWorkTip).filter(
        models.SmartWorkTip.user_id == user_id
    ).order_by(desc(models.SmartWorkTip.week_start_date)).first()

def update_smartwork_actuals(
    db: Session, tip_id: int, actual_earnings: float, followed_safety_tips: bool
) -> Optional[models.SmartWorkTip]:
    tip = db.query(models.SmartWorkTip).filter(models.SmartWorkTip.id == tip_id).first()
    if tip:
        tip.actual_earnings = actual_earnings
        tip.followed_safety_tips = followed_safety_tips
        db.commit()
        db.refresh(tip)
    return tip
