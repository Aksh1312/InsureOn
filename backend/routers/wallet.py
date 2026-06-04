from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..dependencies import get_db, get_current_user
from .. import models, crud

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/transactions")
def get_wallet_transactions(
    transaction_type: Optional[str] = Query(None, description="Filter by type: PREMIUM_PAYMENT, CLAIM_PAYOUT, etc."),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transactions = crud.get_transactions(
        db=db,
        user_id=current_user.id,
        transaction_type=transaction_type,
        limit=limit,
        offset=offset,
    )
    return transactions
