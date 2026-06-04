import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from datetime import date, timedelta
import httpx
from .. import models, crud, schemas
from ..dependencies import get_db, get_current_user
from ..services.notification_service import create_notification

router = APIRouter(prefix="/policies", tags=["Policies"])

POLICY_PAYMENT_GATEWAY_URL = os.getenv("POLICY_PAYMENT_GATEWAY_URL", "").rstrip("/")
POLICY_PAYMENT_GATEWAY_PATH = os.getenv("POLICY_PAYMENT_GATEWAY_PATH", "/payments/policy")
POLICY_PAYMENT_TIMEOUT_SECONDS = float(os.getenv("POLICY_PAYMENT_TIMEOUT_SECONDS", "10"))


def _capture_policy_payment(policy: models.Policy, user: models.User) -> None:
    if not POLICY_PAYMENT_GATEWAY_URL:
        return

    payload = {
        "policy_id": policy.id,
        "user_id": user.id,
        "amount": policy.weekly_premium,
        "currency": "INR",
        "email": user.email,
        "week_start_date": policy.week_start_date.isoformat(),
    }

    with httpx.Client(base_url=POLICY_PAYMENT_GATEWAY_URL, timeout=POLICY_PAYMENT_TIMEOUT_SECONDS) as client:
        resp = client.post(POLICY_PAYMENT_GATEWAY_PATH, json=payload)

    resp.raise_for_status()



@router.post("/issue", response_model=schemas.PolicyOut)
def issue_weekly_policy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Issue a new weekly policy starting from the current Monday."""
    profile = crud.get_worker_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Please set up your profile first")

    # Check if policy already exists for this week
    today       = date.today()
    week_start  = today - timedelta(days=today.weekday())
    existing    = db.query(models.Policy).filter(
        models.Policy.user_id == current_user.id,
        models.Policy.week_start_date == week_start,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Plan already created for this week")

    policy = crud.create_policy(
        db=db,
        user_id=current_user.id,
        week_start_date=week_start,
        zone=profile.zone.value,
        tier=profile.tier.value,
        weekly_coverage=profile.weekly_coverage,
        weekly_premium=profile.weekly_premium,
    )
    create_notification(
        db, current_user.id,
        "Policy Activated",
        f"Coverage ₹{int(policy.weekly_coverage)} is now active until {policy.week_end_date.strftime('%d %b')}.",
        models.NotificationType.POLICY_CREATED,
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
        raise HTTPException(status_code=404, detail="Plan not found")
    if policy.is_paid:
        raise HTTPException(status_code=400, detail="Fee already paid")

    _capture_policy_payment(policy, current_user)
    updated = crud.mark_policy_paid(db, policy_id)
    create_notification(
        db, current_user.id,
        "Premium Paid",
        f"₹{int(policy.weekly_premium)} paid — coverage activated until {policy.week_end_date.strftime('%d %b')}.",
        models.NotificationType.PREMIUM_PAID,
    )
    return updated


@router.get("/active", response_model=schemas.PolicyOut)
def get_active_policy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    policy = crud.get_active_policy(db, current_user.id)
    if not policy:
        raise HTTPException(status_code=404, detail="No active plan for this week")
    return policy


@router.get("/history", response_model=list[schemas.PolicyOut])
def get_policy_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_policy_history(db, current_user.id)


@router.get("/{policy_id}/certificate")
def download_policy_certificate(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Download a PDF certificate for a policy."""
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Plan not found")

    is_admin = current_user.is_admin
    if not is_admin and policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = crud.get_user_by_id(db, policy.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = crud.get_worker_profile(db, policy.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    risk_score = crud.get_latest_risk_score(db, policy.user_id)

    from ..services.pdf_certificate import generate_policy_certificate
    try:
        pdf_buf = generate_policy_certificate(policy, user, profile, risk_score)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = f"InsureOn_Policy_{policy.id}.pdf"
    return Response(
        content=pdf_buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/renewal-preview")
def get_renewal_preview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from ..services.renewal import get_renewal_preview as _renewal_preview
    return _renewal_preview(db, current_user.id)
