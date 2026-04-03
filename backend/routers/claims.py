from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, crud, schemas
from ..dependencies import get_db, get_current_user
from ..services.fraud import evaluate_claim

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.get("/active", response_model=schemas.ClaimOut)
def get_active_claim(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get the worker's currently open (monitoring) claim."""
    claim = crud.get_active_claim(db, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="No active claim")
    return claim


@router.get("/history", response_model=list[schemas.ClaimOut])
def get_claim_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_claims_by_user(db, current_user.id)


@router.get("/{claim_id}", response_model=schemas.ClaimOut)
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim or claim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.get("/{claim_id}/income-logs", response_model=list[schemas.DailyIncomeLogOut])
def get_income_logs(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim or claim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Claim not found")
    return crud.get_income_logs_for_claim(db, claim_id)


@router.get("/{claim_id}/fraud-signal", response_model=schemas.FraudSignalOut)
def get_fraud_signal(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim or claim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Claim not found")
    signal = crud.get_fraud_signal_by_claim(db, claim_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Fraud signal not evaluated yet")
    return signal


@router.post("/{claim_id}/evaluate-fraud", response_model=schemas.FraudSignalOut)
def run_fraud_evaluation(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Manually trigger fraud evaluation on a claim (admin/ops use)."""
    claim = crud.get_claim_by_id(db, claim_id)
    if not claim or claim.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Claim not found")
    return evaluate_claim(db, claim)
