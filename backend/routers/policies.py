from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
import models, crud, schemas
from dependencies import get_db, get_current_user

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.post("/issue", response_model=schemas.PolicyOut)
def issue_weekly_policy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Issue a new weekly policy starting from the current Monday."""
    profile = crud.get_worker_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Worker profile required before issuing policy")

    # Check if policy already exists for this week
    today       = date.today()
    week_start  = today - timedelta(days=today.weekday())
    existing    = db.query(models.Policy).filter(
        models.Policy.user_id == current_user.id,
        models.Policy.week_start_date == week_start,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Policy already issued for this week")

    policy = crud.create_policy(
        db=db,
        user_id=current_user.id,
        week_start_date=week_start,
        zone=profile.zone.value,
        tier=profile.tier.value,
        weekly_coverage=profile.weekly_coverage,
        weekly_premium=profile.weekly_premium,
    )
    return policy


@router.post("/{policy_id}/pay", response_model=schemas.PolicyOut)
def pay_premium(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Mark a policy's premium as paid — activates coverage for the week."""
    policy = db.query(models.Policy).filter(
        models.Policy.id == policy_id,
        models.Policy.user_id == current_user.id,
    ).first()

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if policy.is_paid:
        raise HTTPException(status_code=400, detail="Premium already paid")

    # TODO: Integrate actual payment gateway (Razorpay / PayU) here
    updated = crud.mark_policy_paid(db, policy_id)
    return updated


@router.get("/active", response_model=schemas.PolicyOut)
def get_active_policy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    policy = crud.get_active_policy(db, current_user.id)
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy for this week")
    return policy


@router.get("/history", response_model=list[schemas.PolicyOut])
def get_policy_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_policy_history(db, current_user.id)
