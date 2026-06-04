from .. import models

ALLOWED_TRANSITIONS = {
    models.ClaimStatusEnum.MONITORING: [
        models.ClaimStatusEnum.PAYOUT_READY,
        models.ClaimStatusEnum.MANUAL_REVIEW,
        models.ClaimStatusEnum.CLOSED,
        models.ClaimStatusEnum.REJECTED,
    ],
    models.ClaimStatusEnum.PAYOUT_READY: [
        models.ClaimStatusEnum.CLOSED,
        models.ClaimStatusEnum.MANUAL_REVIEW,
        models.ClaimStatusEnum.REJECTED,
    ],
    models.ClaimStatusEnum.MANUAL_REVIEW: [
        models.ClaimStatusEnum.CLOSED,
        models.ClaimStatusEnum.REJECTED,
        models.ClaimStatusEnum.MONITORING,
        models.ClaimStatusEnum.PAYOUT_READY,
    ],
    models.ClaimStatusEnum.CLOSED: [],
    models.ClaimStatusEnum.REJECTED: [],
}

TERMINAL_STATES = {
    models.ClaimStatusEnum.CLOSED,
    models.ClaimStatusEnum.REJECTED,
}

PAYOUT_TRIGGERING_STATES = {
    models.ClaimStatusEnum.MONITORING,
    models.ClaimStatusEnum.PAYOUT_READY,
}

MONITORABLE_STATES = {
    models.ClaimStatusEnum.MONITORING,
    models.ClaimStatusEnum.PAYOUT_READY,
}


def validate_transition(
    from_status: models.ClaimStatusEnum,
    to_status: models.ClaimStatusEnum,
) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(from_status, [])
    if to_status in allowed:
        return True
    return False


def assert_transition(
    from_status: models.ClaimStatusEnum,
    to_status: models.ClaimStatusEnum,
    claim_id: int = 0,
):
    if not validate_transition(from_status, to_status):
        raise ValueError(
            f"Invalid state transition: {from_status.value} -> {to_status.value} "
            f"for claim {claim_id}"
        )


def is_terminal(status: models.ClaimStatusEnum) -> bool:
    return status in TERMINAL_STATES


def can_monitor(status: models.ClaimStatusEnum) -> bool:
    return status in MONITORABLE_STATES


def can_trigger_payout(status: models.ClaimStatusEnum) -> bool:
    return status in PAYOUT_TRIGGERING_STATES
