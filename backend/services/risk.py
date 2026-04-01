"""
Risk Score Calculation Engine
------------------------------
Formula:
  Risk Score = (Zone × 0.30) + (Pincode Freq × 0.25)
             + (Work Hours × 0.20) + (Work Time × 0.15)
             + (Claim History × 0.10)

Score range: 1.0 – 3.0
Category + Multiplier:
  1.0–1.5 → LOW       → 0.85x
  1.6–2.0 → MEDIUM    → 1.00x
  2.1–2.5 → HIGH      → 1.20x
  2.6–3.0 → VERY_HIGH → 1.40x
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
import models
import crud

# Pincode disaster frequency lookup (days/year)
# Extend this dict as you onboard more cities
PINCODE_RISK_MAP = {
    # Zone A — high disaster frequency
    "600": 3,  # Chennai pincodes start with 600
    "400": 3,  # Mumbai
    "700": 3,  # Kolkata
    # Zone B — moderate
    "560": 2,  # Bengaluru
    "500": 2,  # Hyderabad
    "380": 2,  # Ahmedabad
    # Zone C — low
    "110": 1,  # Delhi
    "411": 1,  # Pune
    "302": 1,  # Jaipur
}

def _get_pincode_score(pincode: str) -> int:
    prefix = pincode[:3]
    freq = PINCODE_RISK_MAP.get(prefix, 2)  # default medium if unknown
    if freq == 1:
        return 1   # <2 days/yr
    elif freq == 2:
        return 2   # 2–5 days/yr
    else:
        return 3   # 5+ days/yr

def _get_zone_score(zone: str) -> int:
    return {"C": 1, "B": 2, "A": 3}.get(zone, 2)

def _get_hours_score(avg_weekly_hours: float) -> int:
    if avg_weekly_hours < 20:
        return 1
    elif avg_weekly_hours <= 40:
        return 2
    else:
        return 3

def _get_shift_score(shift: str) -> int:
    return {"afternoon": 1, "morning": 2, "night": 3}.get(shift, 2)

def _get_claim_score(db: Session, user_id: int) -> int:
    history = crud.get_risk_score_history(db, user_id)
    # Count closed claims in the last 6 months
    six_months_ago = date.today() - timedelta(days=180)
    past_claims = db.query(models.Claim).filter(
        models.Claim.user_id == user_id,
        models.Claim.status == models.ClaimStatusEnum.CLOSED,
        models.Claim.created_at >= six_months_ago,
    ).count()
    if past_claims == 0:
        return 1
    elif past_claims == 1:
        return 2
    else:
        return 3

def _score_to_category_and_multiplier(score: float):
    if score <= 1.5:
        return models.RiskCategoryEnum.LOW, 0.85
    elif score <= 2.0:
        return models.RiskCategoryEnum.MEDIUM, 1.00
    elif score <= 2.5:
        return models.RiskCategoryEnum.HIGH, 1.20
    else:
        return models.RiskCategoryEnum.VERY_HIGH, 1.40

def calculate_and_save_risk_score(db: Session, user_id: int) -> models.RiskScore:
    """
    Main entry point. Call this every Monday for each active worker.
    Reads profile, calculates score, saves to risk_scores table.
    """
    profile = crud.get_worker_profile(db, user_id)
    if not profile:
        raise ValueError(f"No worker profile found for user_id={user_id}")

    zone_score    = _get_zone_score(profile.zone)
    pincode_score = _get_pincode_score(profile.pincode)
    hours_score   = _get_hours_score(profile.avg_weekly_hours)
    shift_score   = _get_shift_score(profile.primary_shift)
    claim_score   = _get_claim_score(db, user_id)

    total = (
        zone_score    * 0.30 +
        pincode_score * 0.25 +
        hours_score   * 0.20 +
        shift_score   * 0.15 +
        claim_score   * 0.10
    )
    total = round(total, 2)

    category, multiplier = _score_to_category_and_multiplier(total)

    # Get Monday of the current week
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    risk = crud.create_risk_score(
        db=db,
        user_id=user_id,
        week_start_date=week_start,
        zone_score=zone_score,
        pincode_score=pincode_score,
        hours_score=hours_score,
        shift_score=shift_score,
        claim_score=claim_score,
        total_score=total,
        risk_category=category,
        multiplier=multiplier,
    )
    return risk
