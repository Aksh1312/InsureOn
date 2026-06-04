from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from .. import models, crud
from ..dependencies import get_db, get_admin_user
from ..services.tracing import get_eligibility_events, get_eligibility_summary, clear_eligibility_events
from ..services.imd import open_claims_for_trigger, _ensure_active_policy

router = APIRouter(prefix="/debug", tags=["Debug"])


class DebugClaimOut(BaseModel):
    id: int
    user_id: int
    status: str
    loss_counter: int
    days_of_loss: int | None
    payout_amount: float | None
    fraud_probability: float | None
    is_fraud_flagged: bool
    monitoring_start: str
    monitoring_end: str | None
    created_at: str
    updated_at: str | None
    has_payout: bool
    has_fraud_signal: bool
    income_log_count: int


@router.get("/claims")
def debug_claims(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    all_claims = db.query(models.Claim).order_by(models.Claim.created_at.desc()).limit(100).all()
    out = []
    for c in all_claims:
        payout = db.query(models.Payout).filter(models.Payout.claim_id == c.id).first()
        fraud = db.query(models.FraudSignal).filter(models.FraudSignal.claim_id == c.id).first()
        log_count = db.query(models.DailyIncomeLog).filter(
            models.DailyIncomeLog.claim_id == c.id
        ).count()
        out.append(DebugClaimOut(
            id=c.id,
            user_id=c.user_id,
            status=c.status.value if hasattr(c.status, 'value') else str(c.status),
            loss_counter=c.loss_counter,
            days_of_loss=c.days_of_loss,
            payout_amount=c.payout_amount,
            fraud_probability=c.fraud_probability,
            is_fraud_flagged=c.is_fraud_flagged,
            monitoring_start=str(c.monitoring_start),
            monitoring_end=str(c.monitoring_end) if c.monitoring_end else None,
            created_at=str(c.created_at) if c.created_at else None,
            updated_at=str(c.updated_at) if c.updated_at else None,
            has_payout=payout is not None,
            has_fraud_signal=fraud is not None,
            income_log_count=log_count,
        ))
    return {
        "total": len(out),
        "claims": out,
    }


@router.get("/stuck-claims")
def debug_stuck_claims(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    today = date.today()
    stuck = []
    claims = db.query(models.Claim).filter(
        models.Claim.status.in_([models.ClaimStatusEnum.MONITORING, models.ClaimStatusEnum.PAYOUT_READY])
    ).all()
    for c in claims:
        days_open = (today - c.monitoring_start).days
        log_count = db.query(models.DailyIncomeLog).filter(
            models.DailyIncomeLog.claim_id == c.id
        ).count()
        if days_open > 14 or (c.status == models.ClaimStatusEnum.PAYOUT_READY and days_open > 2):
            stuck.append({
                "id": c.id,
                "user_id": c.user_id,
                "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
                "days_open": days_open,
                "loss_counter": c.loss_counter,
                "income_log_count": log_count,
            })
    return {
        "total_stuck": len(stuck),
        "stuck_claims": stuck,
    }


@router.get("/payouts")
def debug_payouts(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    payouts = db.query(models.Payout).order_by(models.Payout.created_at.desc()).limit(100).all()
    return {
        "total": len(payouts),
        "payouts": [
            {
                "id": p.id,
                "claim_id": p.claim_id,
                "user_id": p.user_id,
                "amount": p.amount,
                "is_sent": p.is_sent,
                "transaction_id": p.transaction_id,
                "created_at": str(p.created_at) if p.created_at else None,
            }
            for p in payouts
        ],
    }


@router.get("/failures")
def debug_failures(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    orphan_claims = []
    claims = db.query(models.Claim).all()
    for c in claims:
        payout = db.query(models.Payout).filter(models.Payout.claim_id == c.id).first()
        if c.status == models.ClaimStatusEnum.CLOSED and not payout:
            orphan_claims.append({
                "id": c.id,
                "status": "closed_no_payout",
                "user_id": c.user_id,
            })
        if c.status in (models.ClaimStatusEnum.PAYOUT_READY, models.ClaimStatusEnum.MONITORING):
            days = (date.today() - c.monitoring_start).days
            log_count = db.query(models.DailyIncomeLog).filter(
                models.DailyIncomeLog.claim_id == c.id
            ).count()
            if days > 14 and log_count == 0:
                orphan_claims.append({
                    "id": c.id,
                    "status": str(c.status.value if hasattr(c.status, 'value') else c.status),
                    "days_open": days,
                    "income_log_count": log_count,
                    "note": "no income logs despite being open >14 days",
                })
    return {
        "anomalies_found": len(orphan_claims),
        "anomalies": orphan_claims,
    }


@router.get("/transitions")
def debug_transitions(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    claims = db.query(models.Claim).order_by(models.Claim.id).limit(200).all()
    history = []
    for c in claims:
        payout = db.query(models.Payout).filter(models.Payout.claim_id == c.id).first()
        fraud = db.query(models.FraudSignal).filter(models.FraudSignal.claim_id == c.id).first()
        log_count = db.query(models.DailyIncomeLog).filter(
            models.DailyIncomeLog.claim_id == c.id
        ).count()
        history.append({
            "claim_id": c.id,
            "user_id": c.user_id,
            "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
            "loss_counter": c.loss_counter,
            "has_payout": payout is not None,
            "payout_sent": payout.is_sent if payout else False,
            "has_fraud_signal": fraud is not None,
            "fraud_decision": fraud.decision if fraud else None,
            "income_log_count": log_count,
            "days_since_monitoring_start": (date.today() - c.monitoring_start).days,
        })
    return {
        "total": len(history),
        "transitions": history,
    }


@router.get("/income-logs")
def debug_income_logs(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    logs = db.query(models.DailyIncomeLog).order_by(
        models.DailyIncomeLog.log_date.desc()
    ).limit(200).all()
    return {
        "total": len(logs),
        "logs": [
            {
                "id": l.id,
                "claim_id": l.claim_id,
                "user_id": l.user_id,
                "log_date": str(l.log_date),
                "income_earned": l.income_earned,
                "baseline_income": l.baseline_income,
                "is_below_threshold": l.is_below_threshold,
                "platform_logged_in": l.platform_logged_in,
            }
            for l in logs
        ],
    }


@router.get("/fraud-signals")
def debug_fraud_signals(db: Session = Depends(get_db), _admin=Depends(get_admin_user)):
    signals = db.query(models.FraudSignal).order_by(
        models.FraudSignal.evaluated_at.desc()
    ).limit(100).all()
    return {
        "total": len(signals),
        "signals": [
            {
                "id": s.id,
                "claim_id": s.claim_id,
                "user_id": s.user_id,
                "fraud_probability": s.fraud_probability,
                "decision": s.decision,
                "is_fraud_ring_flagged": s.is_fraud_ring_flagged,
                "evaluated_at": str(s.evaluated_at) if s.evaluated_at else None,
            }
            for s in signals
        ],
    }


@router.get("/eligibility-failures")
def debug_eligibility_failures(
    limit: int = Query(200, ge=1, le=2000),
    _admin=Depends(get_admin_user),
):
    """Return detailed eligibility check results from recent claim opening attempts."""
    events = get_eligibility_events(limit=limit)
    summary = get_eligibility_summary()
    failed = [e for e in events if not e["eligible"]]
    return {
        "summary": summary,
        "recent_eligibility_checks": len(events),
        "recent_failures": len(failed),
        "failed_events": failed[-200:],
    }


@router.get("/claim-opening")
def debug_claim_opening(
    limit: int = Query(200, ge=1, le=2000),
    _admin=Depends(get_admin_user),
):
    """Return all recent claim opening eligibility events (both eligible and skipped)."""
    events = get_eligibility_events(limit=limit)
    summary = get_eligibility_summary()
    return {
        "summary": summary,
        "events": events[-limit:],
    }


@router.post("/eligibility-clear")
def debug_clear_eligibility(_admin=Depends(get_admin_user)):
    """Clear all recorded eligibility events."""
    clear_eligibility_events()
    return {"status": "cleared"}


@router.get("/zone-eligibility/{zone}")
def debug_zone_eligibility(
    zone: str,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Diagnose claim-opening eligibility for ALL workers in a zone."""
    zone = zone.upper()
    if zone not in ("A", "B", "C"):
        raise HTTPException(status_code=400, detail="Zone must be A, B, or C")

    today = date.today()
    profiles = db.query(models.WorkerProfile).filter(
        models.WorkerProfile.zone == zone
    ).all()

    workers = []
    for p in profiles:
        user = crud.get_user_by_id(db, p.user_id)
        policies = db.query(models.Policy).filter(
            models.Policy.user_id == p.user_id
        ).order_by(models.Policy.created_at.desc()).all()

        active_policy = crud.get_active_policy(db, p.user_id)
        existing_claim = crud.get_active_claim(db, p.user_id)

        renewed = None
        renew_error = None
        try:
            renewed = _ensure_active_policy(db, p.user_id, p)
        except Exception as ex:
            renew_error = str(ex)

        workers.append({
            "user_id": p.user_id,
            "email": user.email if user else None,
            "zone": str(p.zone),
            "tier": str(p.tier),
            "pincode": p.pincode,
            "exists_in_system": user is not None,
            "policies": [
                {
                    "id": pol.id,
                    "week_start": str(pol.week_start_date),
                    "week_end": str(pol.week_end_date),
                    "is_active": pol.is_active,
                    "is_paid": pol.is_paid,
                    "is_valid_this_week": pol.week_start_date <= today <= pol.week_end_date,
                }
                for pol in policies
            ],
            "has_active_policy": active_policy is not None,
            "active_policy_id": active_policy.id if active_policy else None,
            "active_policy_start": str(active_policy.week_start_date) if active_policy else None,
            "active_policy_end": str(active_policy.week_end_date) if active_policy else None,
            "active_policy_paid": active_policy.is_paid if active_policy else None,
            "has_existing_claim": existing_claim is not None,
            "existing_claim_id": existing_claim.id if existing_claim else None,
            "existing_claim_status": str(existing_claim.status) if existing_claim else None,
            "auto_renew_result": str(renewed) if renewed else "FAILED",
            "auto_renew_error": renew_error,
        })

    return {
        "zone": zone,
        "today": str(today),
        "workers_in_zone": len(profiles),
        "workers": workers,
        "diagnosis": (
            "ALL WORKERS BLOCKED" if all(not w["has_active_policy"] and w["auto_renew_result"] == "FAILED" for w in workers)
            else "SOME WORKERS ELIGIBLE" if any(w["has_active_policy"] or w["auto_renew_result"] != "FAILED" for w in workers)
            else "NO WORKERS"
        ),
    }
