import time
import random
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta, datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import os
from fastapi import Header
from fastapi.security import OAuth2PasswordBearer
from .. import models, schemas, crud
from ..dependencies import get_db, get_admin_user, get_current_user
from ..auth import hash_password
from ..services.imd import open_claims_for_trigger
from ..services.risk import calculate_and_save_risk_score
from ..services.notification_service import create_notification
from ..services.premium import (
    assign_zone, assign_tier, calculate_coverage,
    calculate_base_premium, calculate_final_premium, get_pricing_adjustments,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

def get_admin_or_sim_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
    x_sim_test_key: Optional[str] = Header(default=None),
) -> Optional[models.User]:
    sim_key = os.getenv("SIM_TEST_API_KEY")
    if sim_key and x_sim_test_key == sim_key:
        return None  # Authorized via simulation key

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    current_user = get_current_user(token=token, db=db)
    if not current_user.is_admin and "admin" not in current_user.email.lower():
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

class TTLCache:
    _stores: dict[str, tuple[float, object]] = {}

    @classmethod
    def get(cls, key: str, ttl: float = 30.0):
        stored_at, value = cls._stores.get(key, (0.0, None))
        if time.monotonic() - stored_at < ttl:
            return value
        return None

    @classmethod
    def set(cls, key: str, value: object):
        cls._stores[key] = (time.monotonic(), value)

    @classmethod
    def delete(cls, key: str):
        cls._stores.pop(key, None)

    @classmethod
    def clear(cls):
        cls._stores.clear()

    @classmethod
    def make_key(cls, func_name: str) -> str:
        return f"admin_agg:{func_name}"


class ClaimReviewRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class AdminCreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    platform: str = "other"
    region: str = "Mumbai"
    income: int = 4000
    pincode: str = "400001"
    upi_id: Optional[str] = None
    avg_weekly_hours: Optional[float] = 22.0
    primary_shift: Optional[str] = None
    is_multi_platform: bool = False
    is_admin: bool = False

    @field_validator("income")
    def income_must_be_positive(cls, v):
        if v < 1500:
            raise ValueError("Weekly income must be at least Rs. 1,500")
        return v

    @field_validator("avg_weekly_hours")
    def weekly_hours_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Average weekly hours must be positive")
        return v or 22.0

class SimulateEventRequest(BaseModel):
    district: str
    zone: str
    alert_color: str = "RED"


class AdminDashboardOut(BaseModel):
    total_workers: int
    active_claims: int
    fraud_flagged_claims: int
    total_payout_amount: float
    pending_review_claims: list[schemas.ClaimOut] = []
    recent_triggers: list[schemas.IMDTriggerOut] = []

    model_config = {"from_attributes": True}


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    cached = TTLCache.get(TTLCache.make_key("dashboard"), ttl=3.0)
    if cached is not None:
        return cached

    total_workers = db.query(func.count(models.User.id)).filter(models.User.is_admin == False).scalar() or 0

    active_claims = db.query(func.count(models.Claim.id)).filter(
        models.Claim.status == models.ClaimStatusEnum.MONITORING
    ).scalar() or 0

    fraud_flagged = db.query(func.count(models.Claim.id)).filter(
        models.Claim.is_fraud_flagged == True
    ).scalar() or 0

    total_payout = db.query(func.coalesce(func.sum(models.Payout.amount), 0)).filter(
        models.Payout.is_sent == True
    ).scalar() or 0.0

    pending_review = db.query(models.Claim).filter(
        models.Claim.status == models.ClaimStatusEnum.MANUAL_REVIEW
    ).order_by(models.Claim.updated_at.desc().nullslast()).limit(10).all()

    recent_triggers = db.query(models.IMDTriggerEvent).order_by(
        models.IMDTriggerEvent.triggered_at.desc()
    ).limit(10).all()

    result = {
        "total_workers": total_workers,
        "active_claims": active_claims,
        "fraud_flagged_claims": fraud_flagged,
        "total_payout_amount": float(total_payout),
        "pending_review_claims": pending_review,
        "recent_triggers": recent_triggers,
    }
    TTLCache.set(TTLCache.make_key("dashboard"), result)
    return result


@router.get("/workers", response_model=list[schemas.UserOut])
def list_workers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
):
    return db.query(models.User).filter(models.User.is_admin == False).order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    total_users = db.query(func.count(models.User.id)).filter(models.User.is_admin == False).scalar() or 0
    total_claims = db.query(func.count(models.Claim.id)).scalar() or 0
    total_policies = db.query(func.count(models.Policy.id)).scalar() or 0
    total_payouts = db.query(func.count(models.Payout.id)).scalar() or 0
    db_size_bytes = 0
    if os.path.exists("insureon.db"):
        db_size_bytes = os.path.getsize("insureon.db")
    return {
        "total_users": total_users,
        "total_claims": total_claims,
        "total_policies": total_policies,
        "total_payouts": total_payouts,
        "db_size_bytes": db_size_bytes,
        "status": "healthy",
    }


@router.post("/reprice")
def trigger_repricing(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    from ..services.weekly import run_weekly_repricing
    run_weekly_repricing(db)
    return {"status": "success", "message": "Weekly repricing run complete"}


@router.put("/workers/{user_id}/profile", response_model=schemas.WorkerProfileOut)
def admin_update_worker_profile(
    user_id: int,
    updates: schemas.WorkerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    profile = crud.get_worker_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    if updates.pincode is not None:
        if not updates.pincode.isdigit() or len(updates.pincode) != 6:
            raise HTTPException(status_code=422, detail="Pincode must be a 6-digit number")

    profile = crud.update_worker_profile(db, user_id, **updates.model_dump(exclude_none=True))

    weekly_income = profile.avg_weekly_income
    coverage = calculate_coverage(profile.avg_weekly_hours)
    avg_daily_income = round(weekly_income / 6, 2)

    risk = calculate_and_save_risk_score(db, user_id)
    base_premium = calculate_base_premium(profile.avg_weekly_hours, profile.zone.value)
    loadings, discounts = get_pricing_adjustments(
        is_multi_platform=profile.is_multi_platform,
        risk_category=risk.risk_category,
        pincode=profile.pincode,
        has_no_claims=True,
        safe_worker=False,
    )
    final_premium = calculate_final_premium(
        base_premium,
        risk.multiplier,
        applied_loadings=loadings,
        applied_discounts=discounts,
    )

    profile = crud.update_worker_profile(
        db,
        user_id,
        weekly_coverage=coverage,
        avg_daily_income=avg_daily_income,
        weekly_premium=final_premium,
    )
    return profile

@router.post("/users/create", response_model=schemas.UserOut)
def admin_create_user(
    body: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    """Admin creates a new user account with full setup."""
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        full_name=body.full_name or body.email.split("@")[0],
        email=body.email,
        hashed_password=hash_password(body.password),
        platform=body.platform,
        region=body.region,
        income=body.income,
        upi_id=body.upi_id or f"{body.email.split('@')[0]}@pay",
        is_admin=body.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    zone = assign_zone(user.region)
    avg_weekly_hours = body.avg_weekly_hours or 22.0
    tier = assign_tier(avg_weekly_hours)
    avg_daily_income = round(user.income / 6, 2)
    coverage = calculate_coverage(avg_weekly_hours)
    base_premium = calculate_base_premium(avg_weekly_hours, zone.value)

    profile = crud.create_worker_profile(
        db=db, user_id=user.id, zone=zone.value, tier=tier.value,
        pincode=body.pincode, avg_weekly_hours=avg_weekly_hours,
        avg_weekly_income=user.income, avg_daily_income=avg_daily_income,
        primary_shift=body.primary_shift or "afternoon",
        is_multi_platform=body.is_multi_platform,
        weekly_coverage=coverage, weekly_premium=base_premium,
    )

    risk_score = calculate_and_save_risk_score(db, user.id)
    loadings, discounts = get_pricing_adjustments(
        is_multi_platform=body.is_multi_platform,
        risk_category=risk_score.risk_category,
        pincode=body.pincode,
        has_no_claims=True,
        safe_worker=False,
    )
    final_premium = calculate_final_premium(
        base_premium, risk_score.multiplier,
        applied_loadings=loadings, applied_discounts=discounts,
    )
    crud.update_worker_profile(db, user.id, weekly_premium=final_premium)

    policy = crud.create_policy(
        db=db, user_id=user.id,
        week_start_date=(date.today() - timedelta(days=date.today().weekday())),
        zone=zone.value, tier=tier.value,
        weekly_coverage=coverage, weekly_premium=final_premium,
    )
    crud.mark_policy_paid(db, policy.id)

    try:
        from ..services.smartwork import generate_weekly_tip
        generate_weekly_tip(db, user.id)
    except Exception:
        pass

    return user


@router.get("/claims", response_model=list[schemas.ClaimOut])
def list_all_claims(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    is_fraud_flagged: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    q = db.query(models.Claim)
    if status:
        q = q.filter(models.Claim.status == status)
    if user_id is not None:
        q = q.filter(models.Claim.user_id == user_id)
    if is_fraud_flagged is not None:
        q = q.filter(models.Claim.is_fraud_flagged == is_fraud_flagged)
    return q.order_by(models.Claim.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/workers/{user_id}/profile", response_model=schemas.WorkerProfileOut)
def get_worker_profile_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    profile = crud.get_worker_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/policies", response_model=list[schemas.PolicyOut])
def list_all_policies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    q = db.query(models.Policy)
    if user_id is not None:
        q = q.filter(models.Policy.user_id == user_id)
    return q.order_by(models.Policy.week_start_date.desc()).offset(skip).limit(limit).all()


class ClaimAggregationOut(BaseModel):
    total: int
    by_status: dict[str, int]
    fraud_flagged: int
    has_payout: int
    by_status_with_payout: dict[str, int]


@router.get("/claims/aggregate")
def get_claim_aggregation(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_admin_or_sim_user),
):
    cached = TTLCache.get(TTLCache.make_key("claim_agg"), ttl=15.0)
    if cached is not None:
        return cached

    total = db.query(func.count(models.Claim.id)).scalar() or 0

    status_counts = db.query(
        models.Claim.status,
        func.count(models.Claim.id)
    ).group_by(models.Claim.status).all()
    by_status = {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in status_counts}

    fraud_flagged = db.query(func.count(models.Claim.id)).filter(
        models.Claim.is_fraud_flagged == True
    ).scalar() or 0

    status_with_payout = db.query(
        models.Claim.status,
        func.count(models.Claim.id)
    ).join(
        models.Payout, models.Payout.claim_id == models.Claim.id
    ).group_by(models.Claim.status).all()
    by_status_with_payout = {str(row[0]): row[1] for row in status_with_payout}

    result = ClaimAggregationOut(
        total=total,
        by_status=by_status,
        fraud_flagged=fraud_flagged,
        has_payout=sum(by_status_with_payout.values()),
        by_status_with_payout=by_status_with_payout,
    )
    TTLCache.set(TTLCache.make_key("claim_agg"), result)
    return result


class PayoutAggregationOut(BaseModel):
    total_payouts: int
    total_amount: float
    sent_payouts: int
    sent_amount: float
    by_alert_level: dict[str, int]


@router.get("/payouts/aggregate")
def get_payout_aggregation(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    cached = TTLCache.get(TTLCache.make_key("payout_agg"), ttl=15.0)
    if cached is not None:
        return cached

    total_payouts = db.query(func.count(models.Payout.id)).scalar() or 0
    total_amount = db.query(func.coalesce(func.sum(models.Payout.amount), 0)).scalar() or 0.0
    sent_count = db.query(func.count(models.Payout.id)).filter(
        models.Payout.is_sent == True
    ).scalar() or 0
    sent_amount = db.query(func.coalesce(func.sum(models.Payout.amount), 0)).filter(
        models.Payout.is_sent == True
    ).scalar() or 0.0

    alert_counts = db.query(
        models.Payout.alert_level,
        func.count(models.Payout.id)
    ).group_by(models.Payout.alert_level).all()
    by_alert = {row[0]: row[1] for row in alert_counts}

    result = PayoutAggregationOut(
        total_payouts=total_payouts,
        total_amount=float(total_amount),
        sent_payouts=sent_count,
        sent_amount=float(sent_amount),
        by_alert_level=by_alert,
    )
    TTLCache.set(TTLCache.make_key("payout_agg"), result)
    return result


class FraudAggregationOut(BaseModel):
    total_evaluations: int
    by_decision: dict[str, int]
    fraud_ring_flagged: int
    avg_fraud_probability: float


@router.get("/fraud/aggregate")
def get_fraud_aggregation(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_admin_or_sim_user),
):
    cached = TTLCache.get(TTLCache.make_key("fraud_agg"), ttl=15.0)
    if cached is not None:
        return cached

    total = db.query(func.count(models.FraudSignal.id)).scalar() or 0

    decision_counts = db.query(
        models.FraudSignal.decision,
        func.count(models.FraudSignal.id)
    ).group_by(models.FraudSignal.decision).all()
    by_decision = {row[0]: row[1] for row in decision_counts}

    ring_flagged = db.query(func.count(models.FraudSignal.id)).filter(
        models.FraudSignal.is_fraud_ring_flagged == True
    ).scalar() or 0

    avg_prob = db.query(func.coalesce(func.avg(models.FraudSignal.fraud_probability), 0)).scalar() or 0.0

    result = FraudAggregationOut(
        total_evaluations=total,
        by_decision=by_decision,
        fraud_ring_flagged=ring_flagged,
        avg_fraud_probability=round(float(avg_prob), 4),
    )
    TTLCache.set(TTLCache.make_key("fraud_agg"), result)
    return result


@router.get("/claims-overview")
def claims_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    days: int = Query(30, ge=1, le=365),
):
    cached = TTLCache.get(f"{TTLCache.make_key('claims_overview')}:{days}", ttl=15.0)
    if cached is not None:
        return cached
    since = date.today() - timedelta(days=days)
    counts = db.query(
        models.Claim.status,
        func.count(models.Claim.id)
    ).filter(
        models.Claim.created_at >= since
    ).group_by(models.Claim.status).all()
    result = {
        "period_days": days,
        "since": since.isoformat(),
        "total": sum(row[1] for row in counts),
        "by_status": {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in counts},
    }
    TTLCache.set(f"{TTLCache.make_key('claims_overview')}:{days}", result)
    return result


@router.put("/claims/{claim_id}/review", response_model=schemas.ClaimOut)
def review_claim(
    claim_id: int,
    body: ClaimReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    valid_statuses = ["closed", "rejected", "manual_review", "payout_ready"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    status_map = {
        "closed": models.ClaimStatusEnum.CLOSED,
        "rejected": models.ClaimStatusEnum.REJECTED,
        "manual_review": models.ClaimStatusEnum.MANUAL_REVIEW,
        "payout_ready": models.ClaimStatusEnum.PAYOUT_READY,
    }

    requested_status = status_map[body.status]

    # Bust all admin caches so the next dashboard/aggregate fetch sees fresh data
    TTLCache.delete(TTLCache.make_key("dashboard"))
    TTLCache.delete(TTLCache.make_key("claim_agg"))
    TTLCache.delete(TTLCache.make_key("payout_agg"))
    TTLCache.delete(TTLCache.make_key("fraud_agg"))

    if requested_status == models.ClaimStatusEnum.PAYOUT_READY:
        # Admin is manually approving the payout
        create_notification(
            db, claim.user_id,
            "Claim #%d Approved" % claim.id,
            "Your claim has been approved by the review team.",
            models.NotificationType.CLAIM_APPROVED,
            metadata_json='{"claim_id": %d}' % claim.id,
        )

        # 1. Temporarily transition status in database to PAYOUT_READY
        claim.status = models.ClaimStatusEnum.PAYOUT_READY
        db.commit()

        # 2. Trigger the payout service with force_approve = True (bypasses automated fraud blocks)
        from ..services.payout import initiate_payout
        payout = initiate_payout(db, claim, force_approve=True)
        if not payout:
            raise HTTPException(status_code=500, detail="Payment failed during manual payment")
        
        db.refresh(claim)
        return claim

    elif requested_status == models.ClaimStatusEnum.REJECTED:
        claim = crud.update_claim_status(db, claim_id, requested_status)
        create_notification(
            db, claim.user_id,
            "Claim #%d Rejected" % claim.id,
            "Your claim was not approved after review.",
            models.NotificationType.CLAIM_REJECTED,
            metadata_json='{"claim_id": %d}' % claim.id,
        )
        return claim

    elif requested_status == models.ClaimStatusEnum.CLOSED:
        claim = crud.update_claim_status(db, claim_id, requested_status)
        create_notification(
            db, claim.user_id,
            "Claim Closed",
            "Your claim has been closed.",
            models.NotificationType.SYSTEM,
            metadata_json='{"claim_id": %d}' % claim.id,
        )
        return claim
    else:
        # Standard administrative status transition
        claim = crud.update_claim_status(db, claim_id, requested_status)
        return claim


@router.get("/claims-trend")
def claims_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    days: int = Query(7, ge=1, le=90),
):
    today = date.today()
    start = today - timedelta(days=days - 1)
    data = []
    for i in range(days):
        day = start + timedelta(days=i)
        count = db.query(func.count(models.Claim.id)).filter(
            models.Claim.created_at >= day,
            models.Claim.created_at < day + timedelta(days=1),
        ).scalar() or 0
        data.append({"name": day.strftime("%a"), "claims": count})
    return data


@router.get("/risk-distribution")
def risk_distribution(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    latest_ids = db.query(
        func.max(models.RiskScore.id)
    ).group_by(models.RiskScore.user_id).subquery()

    counts = db.query(
        models.RiskScore.risk_category,
        func.count(models.RiskScore.id)
    ).filter(
        models.RiskScore.id.in_(db.query(latest_ids.c.max))
    ).group_by(models.RiskScore.risk_category).all()

    label_map = {
        models.RiskCategoryEnum.LOW: ("Low Risk", "teal"),
        models.RiskCategoryEnum.MEDIUM: ("Medium Risk", "orange"),
        models.RiskCategoryEnum.HIGH: ("High Risk", "red"),
        models.RiskCategoryEnum.VERY_HIGH: ("Very High Risk", "rose"),
    }
    return [
        {"label": label_map.get(row[0], (str(row[0]), "gray"))[0],
         "count": row[1],
         "color": label_map.get(row[0], (str(row[0]), "gray"))[1]}
        for row in counts
    ]


@router.get("/imd-triggers")
def list_imd_triggers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
):
    triggers = db.query(models.IMDTriggerEvent).order_by(
        models.IMDTriggerEvent.triggered_at.desc()
    ).limit(limit).all()
    return triggers


class BroadcastHistoryItem(BaseModel):
    id: int
    title: str
    message: str
    type: str
    region: str
    created_at: datetime
    recipient_count: int


@router.get("/broadcast-history", response_model=list[BroadcastHistoryItem])
def get_broadcast_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
    limit: int = Query(50, ge=1, le=100),
):
    notifications = db.query(models.Notification).filter(
        models.Notification.metadata_json.like('%"broadcast": true%')
    ).order_by(models.Notification.created_at.desc()).all()

    from collections import OrderedDict
    groups = OrderedDict()
    for notif in notifications:
        region = "all"
        try:
            if notif.metadata_json:
                meta = json.loads(notif.metadata_json)
                region = meta.get("region", "all")
        except Exception:
            pass
            
        dt_key = notif.created_at.strftime("%Y-%m-%d %H:%M") if notif.created_at else ""
        key = (notif.title, notif.message, notif.type.value if hasattr(notif.type, 'value') else str(notif.type), region, dt_key)
        
        if key not in groups:
            groups[key] = {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "type": notif.type.value if hasattr(notif.type, 'value') else str(notif.type),
                "region": region,
                "created_at": notif.created_at,
                "recipient_count": 0
            }
        groups[key]["recipient_count"] += 1
        
    return list(groups.values())[:limit]


class AdminSendNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "SYSTEM"


@router.post("/workers/{user_id}/notifications")
def admin_send_notification(
    user_id: int,
    body: AdminSendNotificationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Worker not found")

    notif_type = models.NotificationType.SYSTEM
    try:
        notif_type = models.NotificationType(body.type.upper())
    except ValueError:
        pass

    create_notification(
        db,
        user_id,
        body.title,
        body.message,
        notif_type,
        metadata_json='{"sent_by_admin": true}'
    )
    return {"status": "success", "message": "Notification sent successfully"}


class AdminBroadcastNotificationRequest(BaseModel):
    region: str
    title: str
    message: str
    type: str = "SYSTEM"


@router.post("/broadcast-notification")
def admin_broadcast_notification(
    body: AdminBroadcastNotificationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user),
):
    query = db.query(models.User).filter(models.User.is_admin == False)
    if body.region.lower() != "all":
        query = query.filter(func.lower(models.User.region) == body.region.lower())
    
    workers = query.all()
    if not workers:
        return {"status": "success", "message": "No workers found in selected region", "sent_count": 0}

    notif_type = models.NotificationType.SYSTEM
    try:
        notif_type = models.NotificationType(body.type.upper())
    except ValueError:
        pass

    metadata_val = json.dumps({
        "sent_by_admin": True,
        "broadcast": True,
        "region": body.region
    })

    for worker in workers:
        create_notification(
            db,
            worker.id,
            body.title,
            body.message,
            notif_type,
            metadata_json=metadata_val
        )
    
    return {"status": "success", "message": f"Notification broadcasted to {len(workers)} worker(s)", "sent_count": len(workers)}


