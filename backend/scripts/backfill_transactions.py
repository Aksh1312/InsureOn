"""
One-time ledger backfill.

For every paid policy (is_paid = true) without a PREMIUM_PAYMENT transaction,
create one with reference_id = "policy_{id}".

For every payout record without a CLAIM_PAYOUT transaction,
create one with reference_id = "claim_{claim_id}".

Idempotent: safe to run multiple times.

Usage:
    cd backend/
    python scripts/backfill_transactions.py

    OR (from the repo root):
    python -m backend.scripts.backfill_transactions
"""
import sys
import os

# Ensure the parent of backend/ is on sys.path so backend can be imported as a package
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_parent = os.path.dirname(_backend)
if _parent not in sys.path:
    sys.path.insert(0, _parent)

from backend.db import SessionLocal, engine, apply_legacy_schema_patches
from backend import models
from backend.crud import create_transaction


def backfill_premiums(db):
    count = 0
    policies = db.query(models.Policy).filter(models.Policy.is_paid == True).all()
    for policy in policies:
        ref = f"policy_{policy.id}"
        exists = db.query(models.Transaction).filter(
            models.Transaction.user_id == policy.user_id,
            models.Transaction.reference_id == ref,
            models.Transaction.transaction_type == models.TransactionType.PREMIUM_PAYMENT,
        ).first()
        if exists:
            continue
        create_transaction(
            db=db,
            user_id=policy.user_id,
            transaction_type=models.TransactionType.PREMIUM_PAYMENT,
            amount=policy.weekly_premium,
            status=models.TransactionStatus.SUCCESS,
            reference_id=ref,
            description=f"Weekly premium payment for policy #{policy.id}",
        )
        count += 1
    return count


def backfill_payouts(db):
    count = 0
    payouts = db.query(models.Payout).all()
    for payout in payouts:
        ref = f"claim_{payout.claim_id}"
        exists = db.query(models.Transaction).filter(
            models.Transaction.user_id == payout.user_id,
            models.Transaction.reference_id == ref,
            models.Transaction.transaction_type == models.TransactionType.CLAIM_PAYOUT,
        ).first()
        if exists:
            continue
        create_transaction(
            db=db,
            user_id=payout.user_id,
            transaction_type=models.TransactionType.CLAIM_PAYOUT,
            amount=payout.amount,
            status=models.TransactionStatus.SUCCESS if payout.is_sent else models.TransactionStatus.PENDING,
            reference_id=ref,
            description=f"Claim payout for claim #{payout.claim_id}",
        )
        count += 1
    return count


def main():
    models.Base.metadata.create_all(bind=engine)
    apply_legacy_schema_patches()

    db = SessionLocal()
    try:
        prem_count = backfill_premiums(db)
        payout_count = backfill_payouts(db)
        total = prem_count + payout_count
        print(f"Backfill complete: {prem_count} premium + {payout_count} payout = {total} transactions created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
