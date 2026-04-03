from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, crud, schemas
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/payouts", tags=["Payouts"])


@router.get("/claim/{claim_id}", response_model=schemas.PayoutOut)
def get_payout_for_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim or claim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Claim not found")

    payout = crud.get_payout_by_claim(db, claim_id)
    if not payout:
        raise HTTPException(status_code=404, detail="No payout for this claim yet")
    return payout


@router.get("/history", response_model=list[schemas.PayoutOut])
def get_payout_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    payouts = db.query(models.Payout).filter(
        models.Payout.user_id == current_user.id
    ).all()
    return payouts
