import os
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .. import models, crud, schemas
from ..dependencies import get_db, get_current_user
from ..services.fraud import evaluate_claim
from ..services.imd import open_claims_for_trigger
from ..services.claims import run_simulation_monitoring_cycle

router = APIRouter(prefix="/claims", tags=["Claims"])
SIM_TEST_API_KEY = os.getenv("SIM_TEST_API_KEY")


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


@router.post("/sim/trigger", response_model=schemas.SimTriggerResponse)
def open_claims_from_simulation(
    body: schemas.SimTriggerRequest,
    db: Session = Depends(get_db),
    x_sim_test_key: str | None = Header(default=None),
):
    """Testing hook used by InsureOnSim to open claims from simulated events."""
    if not SIM_TEST_API_KEY:
        raise HTTPException(status_code=503, detail="Simulation bridge key is not configured")
    if x_sim_test_key != SIM_TEST_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid simulation bridge key")

    claims_opened = open_claims_for_trigger(
        db,
        district=body.district,
        zone=body.zone.value,
        alert_color=body.alert_color,
    )
    return schemas.SimTriggerResponse(
        district=body.district,
        zone=body.zone,
        alert_color=body.alert_color,
        claims_opened=claims_opened or 0,
    )


@router.post("/sim/process-monitoring", response_model=schemas.SimMonitoringProcessResponse)
def process_monitoring_from_simulation(
    db: Session = Depends(get_db),
    x_sim_test_key: str | None = Header(default=None),
):
    """Testing hook used by InsureOnSim to advance claim monitoring by one cycle."""
    if not SIM_TEST_API_KEY:
        raise HTTPException(status_code=503, detail="Simulation bridge key is not configured")
    if x_sim_test_key != SIM_TEST_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid simulation bridge key")

    summary = run_simulation_monitoring_cycle(db)
    return schemas.SimMonitoringProcessResponse(**summary)
