import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .. import models, crud
from ..services.premium import calculate_coverage, calculate_base_premium, calculate_final_premium
from ..services.notification_service import create_notification

logger = logging.getLogger("uvicorn.error")


def get_renewal_preview(db: Session, user_id: int) -> dict:
    today = date.today()
    policy = crud.get_active_policy(db, user_id)
    profile = crud.get_worker_profile(db, user_id)
    risk_score = crud.get_latest_risk_score(db, user_id)

    if not policy:
        policy = db.query(models.Policy).filter(
            models.Policy.user_id == user_id,
            models.Policy.is_active == True,
        ).order_by(models.Policy.week_start_date.desc()).first()

    if not policy:
        return {
            "current_policy_id": None,
            "days_remaining": 0,
            "current_premium": 0,
            "current_coverage": 0,
            "next_week_premium": 0,
            "next_week_coverage": 0,
            "renewal_status": "NO_POLICY",
        }

    days_remaining = (policy.week_end_date - today).days

    if policy.is_paid and policy.week_start_date <= today <= policy.week_end_date:
        renewal_status = "ELIGIBLE"
    elif not policy.is_paid:
        renewal_status = "PENDING_PAYMENT"
    elif today > policy.week_end_date:
        renewal_status = "EXPIRED"
    else:
        renewal_status = "ELIGIBLE"

    if profile and risk_score:
        next_coverage = calculate_coverage(profile.avg_weekly_hours, profile.avg_weekly_income)
        zone_value = profile.zone.value if hasattr(profile.zone, 'value') else str(profile.zone)
        next_base = calculate_base_premium(profile.avg_weekly_hours, zone_value, profile.avg_weekly_income)
        risk_multiplier = risk_score.multiplier
        next_premium = calculate_final_premium(next_base, risk_multiplier)
    elif profile:
        next_coverage = calculate_coverage(profile.avg_weekly_hours, profile.avg_weekly_income)
        zone_value = profile.zone.value if hasattr(profile.zone, 'value') else str(profile.zone)
        next_base = calculate_base_premium(profile.avg_weekly_hours, zone_value, profile.avg_weekly_income)
        next_premium = calculate_final_premium(next_base, 1.0)
    else:
        next_coverage = policy.weekly_coverage
        next_premium = policy.weekly_premium

    _create_renewal_reminders(db, user_id, days_remaining, policy)

    return {
        "current_policy_id": policy.id,
        "days_remaining": max(days_remaining, 0),
        "current_premium": policy.weekly_premium,
        "current_coverage": policy.weekly_coverage,
        "next_week_premium": next_premium,
        "next_week_coverage": next_coverage,
        "renewal_status": renewal_status,
    }


def _create_renewal_reminders(db: Session, user_id: int, days_remaining: int, policy: models.Policy) -> None:
    reminders = [
        (3, "Your policy renews in 3 days.", "Your coverage continues automatically. No action needed."),
        (1, "Your policy renews tomorrow.", "Your new week of coverage starts tomorrow."),
    ]
    for target_days, title, message in reminders:
        if days_remaining != target_days:
            continue
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.type == models.NotificationType.POLICY_RENEWED,
            models.Notification.title == title,
            models.Notification.created_at >= policy.week_end_date - timedelta(days=7),
        ).first()
        if not existing:
            create_notification(db, user_id, title, message, models.NotificationType.POLICY_RENEWED)
            logger.info("Created renewal reminder for user %s: %s", user_id, title)
