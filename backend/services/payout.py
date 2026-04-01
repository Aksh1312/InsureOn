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
from datetime import datetime
from sqlalchemy.orm import Session
import models
import crud


PAYOUT_SCALE = {5: 0.70, 6: 0.85, 7: 1.00}


def _calculate_payout_amount(weekly_coverage: float, days_of_loss: int) -> tuple[float, float]:
    """Returns (payout_amount, payout_percentage)"""
    pct = PAYOUT_SCALE.get(min(days_of_loss, 7), 1.00)
    amount = round(weekly_coverage * pct, 2)
    return amount, pct * 100


def _send_upi_payment(upi_id: str, amount: float) -> str:
    """
    TODO: Replace with real UPI gateway integration.
    Recommended gateways: Razorpay or PayU.

    Returns transaction_id on success.
    Raises Exception on failure (triggers fallback to bank transfer).
    """
    # Mock: generate a fake transaction ID for now
    transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
    print(f"[UPI MOCK] Sending ₹{amount} to {upi_id} → txn: {transaction_id}")
    return transaction_id


def _send_bank_transfer(user_id: int, amount: float) -> str:
    """
    Fallback if UPI fails.
    TODO: Integrate with bank transfer API.
    """
    transaction_id = f"BANK_{uuid.uuid4().hex[:12].upper()}"
    print(f"[BANK MOCK] Sending ₹{amount} to user_id={user_id} → txn: {transaction_id}")
    return transaction_id


def initiate_payout(db: Session, claim: models.Claim) -> models.Payout:
    """
    Main entry point. Called from claims service when loss_counter >= 5.
    1. Run fraud check first
    2. If approved → calculate amount → send UPI → write audit log → close claim
    3. If flagged → route to manual review
    """
    from services.fraud import evaluate_claim

    # Run fraud evaluation
    fraud_signal = evaluate_claim(db, claim)

    if fraud_signal.decision == "reject":
        crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.REJECTED)
        print(f"Claim {claim.id} rejected by fraud detection (P={fraud_signal.fraud_probability})")
        return None

    if fraud_signal.decision in ("manual", "fast_review"):
        crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.MANUAL_REVIEW)
        print(f"Claim {claim.id} routed to manual review (P={fraud_signal.fraud_probability})")
        return None

    # Auto-approve → disburse
    policy  = db.query(models.Policy).filter(models.Policy.id == claim.policy_id).first()
    user    = crud.get_user_by_id(db, claim.user_id)
    trigger = db.query(models.IMDTriggerEvent).filter(
        models.IMDTriggerEvent.id == claim.trigger_event_id
    ).first()

    days_of_loss     = min(claim.loss_counter, 7)
    amount, pct      = _calculate_payout_amount(policy.weekly_coverage, days_of_loss)

    # Update claim payout fields
    claim.payout_amount     = amount
    claim.payout_percentage = pct
    claim.days_of_loss      = days_of_loss
    db.commit()

    # Attempt UPI payment
    upi_id = _get_worker_upi(db, claim.user_id)
    try:
        txn_id = _send_upi_payment(upi_id, amount)
    except Exception as e:
        print(f"UPI failed for claim {claim.id}: {e}. Falling back to bank transfer.")
        txn_id = _send_bank_transfer(claim.user_id, amount)

    # Create payout record (audit log)
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

    # Mark payout as sent
    crud.mark_payout_sent(db, payout.id, txn_id)

    # Close the claim
    crud.update_claim_status(db, claim.id, models.ClaimStatusEnum.CLOSED)

    print(f"Payout sent: ₹{amount} to {upi_id} for claim {claim.id} (txn: {txn_id})")
    return payout


def _get_worker_upi(db: Session, user_id: int) -> str:
    """
    TODO: Store UPI ID in WorkerProfile or a separate PaymentInfo table.
    For now, fetch from User table (add upi_id column to User model).
    Placeholder returns a mock UPI ID.
    """
    user = crud.get_user_by_id(db, user_id)
    # Replace with: return user.upi_id
    return f"worker{user_id}@upi"
