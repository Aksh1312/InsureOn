from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from .. import models, crud, schemas
from ..dependencies import get_db, get_current_user
from ..services.risk import calculate_and_save_risk_score
from ..services.premium import (
    assign_zone,
    assign_tier,
    calculate_coverage,
    calculate_base_premium,
    calculate_final_premium,
    get_pricing_adjustments,
)

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.post("/profile", response_model=schemas.WorkerProfileOut)
def create_profile(
    pincode: str,
    avg_weekly_hours: float,
    primary_shift: models.WorkShiftEnum,
    is_multi_platform: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create worker profile after signup. Assigns tier, zone, coverage and premium."""
    existing = crud.get_worker_profile(db, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    zone = assign_zone(current_user.region)
    tier = assign_tier(avg_weekly_hours)

    avg_daily  = round(current_user.income / 6, 2)  # assuming 6 working days
    coverage   = calculate_coverage(current_user.income)
    base_premium  = calculate_base_premium(coverage, zone.value)

    profile = crud.create_worker_profile(
        db=db,
        user_id=current_user.id,
        zone=zone.value,
        tier=tier.value,
        pincode=pincode,
        avg_weekly_hours=avg_weekly_hours,
        avg_weekly_income=current_user.income,
        avg_daily_income=avg_daily,
        primary_shift=primary_shift.value,
        is_multi_platform=is_multi_platform,
        weekly_coverage=coverage,
        weekly_premium=base_premium,
    )

    # Risk score calculation depends on profile fields, so calculate after profile exists.
    risk = calculate_and_save_risk_score(db, current_user.id)
    has_no_claims = True
    safe_worker = False
    loadings, discounts = get_pricing_adjustments(
        is_multi_platform=is_multi_platform,
        risk_category=risk.risk_category,
        pincode=pincode,
        has_no_claims=has_no_claims,
        safe_worker=safe_worker,
    )
    final_premium = calculate_final_premium(
        base_premium,
        risk.multiplier,
        applied_loadings=loadings,
        applied_discounts=discounts,
    )
    profile = crud.update_worker_profile(db, current_user.id, weekly_premium=final_premium)

    return profile


@router.get("/profile", response_model=schemas.WorkerProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.get_worker_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", response_model=schemas.WorkerProfileOut)
def update_profile(
    updates: schemas.WorkerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    profile = crud.update_worker_profile(db, current_user.id, **updates.model_dump(exclude_none=True))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    weekly_income = profile.avg_weekly_income
    coverage = calculate_coverage(weekly_income)
    avg_daily_income = round(weekly_income / 6, 2)
    profile = crud.update_worker_profile(
        db,
        current_user.id,
        weekly_coverage=coverage,
        avg_daily_income=avg_daily_income,
    )

    # Keep pricing in sync whenever profile risk inputs change.
    risk = calculate_and_save_risk_score(db, current_user.id)
    six_months_ago = date.today() - timedelta(days=180)
    has_no_claims = crud.count_closed_claims_since(db, current_user.id, six_months_ago) == 0
    latest_tip = crud.get_latest_smartwork_tip(db, current_user.id)
    safe_worker = bool(latest_tip and latest_tip.followed_safety_tips)
    base_premium = calculate_base_premium(coverage, profile.zone.value)
    loadings, discounts = get_pricing_adjustments(
        is_multi_platform=profile.is_multi_platform,
        risk_category=risk.risk_category,
        pincode=profile.pincode,
        has_no_claims=has_no_claims,
        safe_worker=safe_worker,
    )
    final_premium = calculate_final_premium(
        base_premium,
        risk.multiplier,
        applied_loadings=loadings,
        applied_discounts=discounts,
    )
    profile = crud.update_worker_profile(db, current_user.id, weekly_premium=final_premium)
    return profile


@router.get("/risk-score", response_model=schemas.RiskScoreOut)
def get_risk_score(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    score = crud.get_latest_risk_score(db, current_user.id)
    if not score:
        raise HTTPException(status_code=404, detail="No risk score found")
    return score


@router.get("/risk-score/history", response_model=list[schemas.RiskScoreOut])
def get_risk_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_risk_score_history(db, current_user.id)


@router.post("/risk-score/recalculate", response_model=schemas.RiskScoreOut)
def recalculate_risk_score(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return calculate_and_save_risk_score(db, current_user.id)


@router.get("/smartwork", response_model=schemas.SmartWorkTipOut)
def get_smartwork_tip(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tip = crud.get_latest_smartwork_tip(db, current_user.id)
    if not tip:
        raise HTTPException(status_code=404, detail="No SmartWork tips yet")
    return tip


@router.put("/smartwork/{tip_id}/actuals", response_model=schemas.SmartWorkTipOut)
def update_smartwork_actuals(
    tip_id: int,
    body: schemas.SmartWorkActualUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tip = crud.update_smartwork_actuals(db, tip_id, body.actual_earnings, body.followed_safety_tips)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    return tip
