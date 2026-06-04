"""
Claims Service — Daily Midnight Job
-------------------------------------
Runs every midnight for all active (monitoring) claims.
- Pulls today's income from platform API (mocked here, replace with real API call)
- Compares against worker's daily baseline
- Increments or resets loss counter
- When counter hits 5 → mark payout_ready and calculate amount
"""

from datetime import date, timedelta
import os
import re
from typing import Optional
from collections import Counter

import httpx
from sqlalchemy.orm import Session
from .. import models
from .. import crud
from .payout import initiate_payout
from .audit import lifecycle_log, audit_error
from .state_machine import is_terminal, can_monitor
from .notification_service import create_notification


SIM_BASE_URL = os.getenv("INSUREON_SIM_URL", "http://127.0.0.1:8001").rstrip("/")
SIM_HTTP_TIMEOUT = float(os.getenv("INSUREON_SIM_TIMEOUT_SECONDS", "10"))
SIM_EMAIL_PATTERN = re.compile(r"^worker(\d+)@sim\.insureon\.dev$")


def run_daily_income_check(db: Session):
    """
    Call this function every midnight via a scheduler (APScheduler or Celery).
    Processes all claims currently in MONITORING status.
    """
    active_claims = db.query(models.Claim).filter(
        models.Claim.status == models.ClaimStatusEnum.MONITORING
    ).all()

    lifecycle_log("income_check_start", f"Processing {len(active_claims)} active claims", sim_day=date.today().isoformat())

    results = []
    for claim in active_claims:
        try:
            result = process_claim_income(db, claim)
            results.append(result)
        except Exception as e:
            audit_error("process_claim_income", e, claim_id=claim.id, worker_id=claim.user_id)
            results.append({"claim_id": claim.id, "status": "error", "error": str(e)})

    lifecycle_log("income_check_complete", f"Processed {len(results)} claims", sim_day=date.today().isoformat())
    return results


def run_simulation_monitoring_cycle(db: Session) -> dict:
    """
    Runs one monitoring cycle for all active claims and returns a compact summary.
    Intended for simulation integration tests, not public production traffic.
    """
    results = run_daily_income_check(db)
    status_counts = Counter(result.get("status", "unknown") for result in results)
    return {
        "processed": len(results),
        "status_counts": dict(status_counts),
        "results": results,
    }


def process_claim_income(db: Session, claim: models.Claim) -> dict:
    """
    Process one claim for today:
    1. Get today's earnings from platform API
    2. Log the income
    3. Increment or reset loss counter
    4. If counter >= 5 → trigger payout
    5. Handle inactivity scenarios (A, B, C, D)
    """
    if is_terminal(claim.status):
        return {"claim_id": claim.id, "status": "skipped", "reason": "terminal_state"}

    user    = crud.get_user_by_id(db, claim.user_id)
    profile = crud.get_worker_profile(db, claim.user_id)

    if not profile:
        return {"claim_id": claim.id, "status": "skipped", "reason": "no profile"}

    today_income      = _fetch_today_income(db, claim.user_id)
    platform_logged_in = _check_platform_login(db, claim.user_id)
    baseline          = profile.avg_daily_income

    crud.create_daily_income_log(
        db=db,
        claim_id=claim.id,
        user_id=claim.user_id,
        log_date=date.today(),
        income_earned=today_income,
        baseline_income=baseline,
        platform_logged_in=platform_logged_in,
    )

    is_below_threshold = today_income < (baseline * 0.50)

    scenario = _detect_inactivity_scenario(
        db, claim.user_id, today_income, platform_logged_in, claim
    )

    if scenario == "D":
        crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.REJECTED)
        create_notification(
            db, claim.user_id,
            "Claim #%d Rejected" % claim.id,
            "Your claim was not approved due to inactivity before the event.",
            models.NotificationType.CLAIM_REJECTED,
            metadata_json='{"claim_id": %d}' % claim.id,
        )
        return {"claim_id": claim.id, "status": "rejected", "reason": "scenario_D"}

    if scenario == "C":
        crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.MANUAL_REVIEW)
        create_notification(
            db, claim.user_id,
            "Claim #%d Requires Review" % claim.id,
            "Your claim has been sent for manual review.",
            models.NotificationType.FRAUD_REVIEW,
            metadata_json='{"claim_id": %d}' % claim.id,
        )
        return {"claim_id": claim.id, "status": "manual_review", "reason": "scenario_C"}

    if is_below_threshold:
        updated_claim = crud.increment_loss_counter(db, claim.id)
        if not updated_claim:
            return {"claim_id": claim.id, "status": "error", "reason": "claim_not_found"}

        if updated_claim.status == models.ClaimStatusEnum.PAYOUT_READY:
            create_notification(
                db, claim.user_id,
                "Claim #%d Approved" % claim.id,
                "5 consecutive loss days confirmed. Payout is being processed.",
                models.NotificationType.CLAIM_APPROVED,
                metadata_json='{"claim_id": %d}' % claim.id,
            )
            initiate_payout(db, updated_claim)
            return {
                "claim_id": claim.id,
                "status": "payout_ready",
                "loss_counter": updated_claim.loss_counter,
            }

        return {
            "claim_id": claim.id,
            "status": "monitoring",
            "loss_counter": updated_claim.loss_counter,
        }
    else:
        crud.reset_loss_counter(db, claim.id)
        return {"claim_id": claim.id, "status": "monitoring", "loss_counter": 0}


def _detect_inactivity_scenario(
    db: Session, user_id: int, today_income: float, platform_logged_in: bool, claim: Optional[models.Claim] = None
) -> str:
    """
    Scenario A — disaster forced zero income (eligible)
    Scenario B — platform outage (eligible)
    Scenario C — voluntarily stopped (manual review)
    Scenario D — already inactive before event (rejected)

    Returns: "A", "B", "C", or "D"
    """
    monitoring_start = claim.monitoring_start if claim else date.today()
    lookback_start = monitoring_start - timedelta(days=7)
    pre_claim_logs = db.query(models.DailyIncomeLog).filter(
        models.DailyIncomeLog.user_id == user_id,
        models.DailyIncomeLog.log_date >= lookback_start,
        models.DailyIncomeLog.log_date < monitoring_start,
    ).all()

    if pre_claim_logs and not any(log.income_earned > 0 for log in pre_claim_logs):
        return "D"

    if today_income == 0 and not platform_logged_in:
        return "A"

    if today_income == 0 and platform_logged_in:
        return "C"

    return "A"


def _resolve_sim_worker_id(db: Session, user_id: int) -> int | None:
    user = crud.get_user_by_id(db, user_id)
    if not user:
        return None

    if user.email:
        match = SIM_EMAIL_PATTERN.match(user.email)
        if match:
            return int(match.group(1))
    return None


def _fetch_sim_platform_metrics(db: Session, user_id: int) -> dict:
    worker_id = _resolve_sim_worker_id(db, user_id)
    if worker_id is None:
        return {"income_earned": 0.0, "platform_logged_in": False}

    try:
        with httpx.Client(base_url=SIM_BASE_URL, timeout=SIM_HTTP_TIMEOUT) as client:
            resp = client.get(f"/worker/{worker_id}/platform-metrics")
        if resp.status_code == 200:
            return resp.json()
        return {"income_earned": 0.0, "platform_logged_in": False}
    except Exception:
        return {"income_earned": 0.0, "platform_logged_in": False}


def _fetch_today_income(db: Session, user_id: int) -> float:
    """
    Returns today's earnings in ₹ from InsureOnSim platform telemetry.
    """
    metrics = _fetch_sim_platform_metrics(db, user_id)
    return float(metrics.get("income_earned", 0.0))


def _check_platform_login(db: Session, user_id: int) -> bool:
    """
    Returns whether worker logged in today from InsureOnSim platform telemetry.
    """
    metrics = _fetch_sim_platform_metrics(db, user_id)
    return bool(metrics.get("platform_logged_in", False))
