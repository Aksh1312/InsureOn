"""
Payout Service
----------------
Called automatically when claim status → payout_ready AND fraud check passes.
Calculates amount, sends via UPI, writes audit log.

Payout scale:
  5 days → 70% of weekly coverage
  6 days → 85% of weekly coverage
  7 days → 100% of weekly coverage
"""

import uuid
import os
from datetime import datetime
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from .. import models
from .. import crud
from .audit import audit_payout, audit_error, audit_transition
from .state_machine import is_terminal, can_trigger_payout
from .notification_service import create_notification


PAYOUT_SCALE = {5: 0.70, 6: 0.85, 7: 1.00}
UPI_GATEWAY_URL = os.getenv("UPI_GATEWAY_URL", "").rstrip("/")
UPI_GATEWAY_PATH = os.getenv("UPI_GATEWAY_PATH", "/payments/upi")
BANK_TRANSFER_GATEWAY_URL = os.getenv("BANK_TRANSFER_GATEWAY_URL", "").rstrip("/")
BANK_TRANSFER_GATEWAY_PATH = os.getenv("BANK_TRANSFER_GATEWAY_PATH", "/payments/bank-transfer")
PAYMENT_TIMEOUT_SECONDS = float(os.getenv("PAYMENT_TIMEOUT_SECONDS", "10"))


def _calculate_payout_amount(weekly_coverage: float, days_of_loss: int) -> tuple[float, float]:
    """
    Returns (payout_amount, payout_percentage)
    Matches the README Payout Structure precisely:
      - 1–4 days of confirmed loss: No payout (0%)
      - 5 days of confirmed loss: 70% of weekly coverage
      - 6 days of confirmed loss: 85% of weekly coverage
      - 7 days of confirmed loss: 100% of weekly coverage
    """
    if days_of_loss < 5:
        # README: 1-4 days of confirmed loss = No payout
        return 0.0, 0.0
    
    pct = PAYOUT_SCALE.get(min(days_of_loss, 7), 1.00)
    amount = round(weekly_coverage * pct, 2)
    return amount, pct * 100


def _send_upi_payment(upi_id: str, amount: float) -> str:
    """
    Returns transaction_id on success.
    Raises Exception on failure (triggers fallback to bank transfer).
    """
    if UPI_GATEWAY_URL:
        payload = {
            "upi_id": upi_id,
            "amount": amount,
            "currency": "INR",
            "reference": f"claim-upi-{uuid.uuid4().hex[:12].upper()}",
        }
        with httpx.Client(base_url=UPI_GATEWAY_URL, timeout=PAYMENT_TIMEOUT_SECONDS) as client:
            resp = client.post(UPI_GATEWAY_PATH, json=payload)
        resp.raise_for_status()
        try:
            body = resp.json()
        except Exception:
            body = {}
        return body.get("transaction_id") or body.get("id") or payload["reference"]

    transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
    print(f"[UPI MOCK] Sending Rs.{amount} to {upi_id} -> txn: {transaction_id}")
    return transaction_id


def _send_bank_transfer(user_id: int, amount: float) -> str:
    """
    Fallback if UPI fails. Uses a configured bank transfer gateway when available,
    otherwise falls back to a local mock transaction id.
    """
    if BANK_TRANSFER_GATEWAY_URL:
        payload = {
            "user_id": user_id,
            "amount": amount,
            "currency": "INR",
            "reference": f"claim-bank-{uuid.uuid4().hex[:12].upper()}",
        }
        with httpx.Client(base_url=BANK_TRANSFER_GATEWAY_URL, timeout=PAYMENT_TIMEOUT_SECONDS) as client:
            resp = client.post(BANK_TRANSFER_GATEWAY_PATH, json=payload)
        resp.raise_for_status()
        try:
            body = resp.json()
        except Exception:
            body = {}
        return body.get("transaction_id") or body.get("id") or payload["reference"]

    transaction_id = f"BANK_{uuid.uuid4().hex[:12].upper()}"
    print(f"[BANK MOCK] Sending Rs.{amount} to user_id={user_id} -> txn: {transaction_id}")
    return transaction_id


def initiate_payout(db: Session, claim: models.Claim, force_approve: bool = False) -> Optional[models.Payout]:
    """
    Main entry point. Called from claims service when loss_counter >= 5, 
    or from the admin router when an administrator manually overrides a review.
    1. Skip automated fraud checks if manually approved (force_approve = True)
    2. Else, run fraud check evaluation
    3. If approved -> calculate amount -> send UPI -> write audit log -> close claim
    """
    if is_terminal(claim.status) and not force_approve:
        audit_error("initiate_payout", ValueError(f"Claim {claim.id} already in terminal state {claim.status}"), claim_id=claim.id, worker_id=claim.user_id)
        return None

    existing_payout = crud.get_payout_by_claim(db, claim.id)
    if existing_payout:
        audit_error("initiate_payout", ValueError(f"Payout already exists for claim {claim.id}"), claim_id=claim.id, worker_id=claim.user_id)
        return existing_payout

    if not force_approve:
        # Automated Fraud Analysis (Runs only for self-triggered claims)
        from .fraud import evaluate_claim
        fraud_signal = evaluate_claim(db, claim)

        if fraud_signal.decision == "reject":
            print(f"Claim {claim.id} rejected by fraud detection (P={fraud_signal.fraud_probability})")
            return None

        if fraud_signal.decision in ("manual", "fast_review"):
            print(f"Claim {claim.id} routed to manual review (P={fraud_signal.fraud_probability})")
            return None
    else:
        print(f"Claim {claim.id} manually approved by Administrator. Bypassing automated fraud checks.")

    policy = db.query(models.Policy).filter(models.Policy.id == claim.policy_id).first()
    if not policy:
        audit_error("initiate_payout", ValueError(f"No policy found for claim {claim.id}"), claim_id=claim.id, worker_id=claim.user_id)
        return None

    trigger = db.query(models.IMDTriggerEvent).filter(
        models.IMDTriggerEvent.id == claim.trigger_event_id
    ).first()

    days_of_loss     = min(claim.loss_counter, 7)
    amount, pct      = _calculate_payout_amount(policy.weekly_coverage, days_of_loss)

    updated_claim = crud.get_claim_by_id(db, claim.id)
    if updated_claim:
        claim = updated_claim

    claim.payout_amount = amount
    claim.payout_percentage = pct
    claim.days_of_loss = days_of_loss
    db.commit()

    upi_id = _get_worker_upi(db, claim.user_id)
    try:
        txn_id = _send_upi_payment(upi_id, amount)
    except Exception as e:
        print(f"UPI failed for claim {claim.id}: {e}. Falling back to bank transfer.")
        txn_id = _send_bank_transfer(claim.user_id, amount)

    payout = crud.create_payout(
        db=db,
        claim_id=claim.id,
        user_id=claim.user_id,
        amount=amount,
        upi_id=upi_id,
        trigger_date=trigger.triggered_at.date() if trigger else claim.monitoring_start,
        alert_level=trigger.alert_color if trigger else "UNKNOWN",
        days_of_loss=days_of_loss,
        payout_percentage=pct,
    )

    if payout:
        crud.mark_payout_sent(db, payout.id, txn_id)
        crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.CLOSED)
        audit_payout(claim.id, amount, txn_id, worker_id=claim.user_id)
        if amount > 0:
            create_notification(
                db, claim.user_id,
                "Claim #%d Payout Sent" % claim.id,
                "₹%d transferred successfully to your UPI." % int(amount),
                models.NotificationType.PAYOUT_SENT,
                metadata_json='{"claim_id": %d, "amount": %.2f}' % (claim.id, amount),
            )
        else:
            create_notification(
                db, claim.user_id,
                "Claim #%d Closed" % claim.id,
                "No payout was issued for this claim.",
                models.NotificationType.SYSTEM,
                metadata_json='{"claim_id": %d}' % claim.id,
            )
        print(f"Payout sent: Rs.{amount} to {upi_id} for claim {claim.id} (txn: {txn_id})")

    return payout


def _get_worker_upi(db: Session, user_id: int) -> str:
    user = crud.get_user_by_id(db, user_id)
    if user and user.upi_id:
        return user.upi_id
    return f"worker{user_id}@upi"
