from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_user
from ..services.premium import (
    calculate_coverage,
    calculate_base_premium,
    calculate_final_premium,
    get_pricing_adjustments,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummaryOut)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.get_worker_profile(db, current_user.id)
    risk_score = crud.get_latest_risk_score(db, current_user.id)
    smartwork_tip = crud.get_latest_smartwork_tip(db, current_user.id)
    if smartwork_tip and any(getattr(smartwork_tip, f) is None for f in ("recommended_slots", "risk_outlook", "premium_projection", "city_insights", "confidence_score")):
        from ..services.smartwork import generate_weekly_tip
        try:
            generate_weekly_tip(db, current_user.id, send_notification=False)
            smartwork_tip = crud.get_latest_smartwork_tip(db, current_user.id)
        except Exception:
            pass
    active_policy = crud.get_active_policy(db, current_user.id)
    policy_history = crud.get_policy_history(db, current_user.id)
    active_claim = crud.get_active_claim(db, current_user.id)
    claim_history = crud.get_claims_by_user(db, current_user.id)
    target_claim = active_claim or (claim_history[0] if claim_history else None)
    income_logs = crud.get_income_logs_for_claim(db, target_claim.id) if target_claim else []
    payout_history = db.query(models.Payout).filter(models.Payout.user_id == current_user.id).all()

    premium_breakdown = None
    if profile:
        zone = profile.zone.value if hasattr(profile.zone, "value") else profile.zone
        tier = profile.tier.value if hasattr(profile.tier, "value") else profile.tier
        weekly_coverage = calculate_coverage(profile.avg_weekly_hours)
        base_premium = calculate_base_premium(profile.avg_weekly_hours, zone)
        weekly_premium = calculate_final_premium(base_premium)
        premium_breakdown = {
            "zone": zone,
            "tier": tier,
            "avg_weekly_hours": profile.avg_weekly_hours,
            "avg_weekly_income": profile.avg_weekly_income or float(current_user.income),
            "weekly_coverage": weekly_coverage,
            "base_premium": base_premium,
            "risk_multiplier": 1.0,
            "weekly_premium": weekly_premium,
            "applied_loadings": [],
            "applied_discounts": [],
        }

    return {
        "user": current_user,
        "profile": profile,
        "risk_score": risk_score,
        "smartwork_tip": smartwork_tip,
        "active_policy": active_policy,
        "policy_history": policy_history,
        "active_claim": active_claim,
        "claim_history": claim_history,
        "income_logs": income_logs,
        "payout_history": payout_history,
        "premium_breakdown": premium_breakdown,
    }