import logging
import sys
import traceback

_logger = logging.getLogger("insureon.lifecycle")
_lifecycle_handler = None

LIFECYCLE_LOG_PATH = None

def setup_lifecycle_logging():
    global _lifecycle_handler
    _logger.setLevel(logging.INFO)
    _logger.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[LIFECYCLE] %(asctime)s | day=%(sim_day)s | worker=%(worker_id)s | claim=%(claim_id)s | %(event)s | %(message)s"
    )
    handler.setFormatter(formatter)
    _logger.addHandler(handler)
    _logger.propagate = False

def lifecycle_log(event: str, message: str = "", **fields):
    extra = {
        "sim_day": fields.pop("sim_day", "?"),
        "worker_id": fields.pop("worker_id", "?"),
        "claim_id": fields.pop("claim_id", "?"),
        "event": event,
    }
    extra.update(fields)
    _logger.info(message, extra=extra)

def audit_transition(
    claim_id: int,
    from_status: str,
    to_status: str,
    reason: str = "",
    worker_id: int = 0,
    sim_day: str = "?",
):
    lifecycle_log(
        event="state_transition",
        message=f"{from_status} -> {to_status} | {reason}",
        claim_id=claim_id,
        worker_id=worker_id,
        sim_day=sim_day,
        from_status=from_status,
        to_status=to_status,
        reason=reason,
    )

def audit_payout(
    claim_id: int,
    amount: float,
    txn_id: str,
    worker_id: int = 0,
    sim_day: str = "?",
    status: str = "sent",
):
    lifecycle_log(
        event="payout",
        message=f"Rs.{amount} txn={txn_id} status={status}",
        claim_id=claim_id,
        worker_id=worker_id,
        sim_day=sim_day,
        amount=amount,
        txn_id=txn_id,
        payout_status=status,
    )

def audit_fraud(
    claim_id: int,
    fraud_prob: float,
    decision: str,
    worker_id: int = 0,
    sim_day: str = "?",
):
    lifecycle_log(
        event="fraud_evaluation",
        message=f"P={fraud_prob} decision={decision}",
        claim_id=claim_id,
        worker_id=worker_id,
        sim_day=sim_day,
        fraud_probability=fraud_prob,
        decision=decision,
    )

def audit_error(
    context: str,
    error: Exception,
    claim_id: int = 0,
    worker_id: int = 0,
    sim_day: str = "?",
):
    tb = "".join(traceback.format_exception(type(error), error, error.__traceback__))
    lifecycle_log(
        event="error",
        message=f"{context}: {error}",
        claim_id=claim_id,
        worker_id=worker_id,
        sim_day=sim_day,
        error_context=context,
        error_type=type(error).__name__,
        traceback=tb,
    )

setup_lifecycle_logging()
