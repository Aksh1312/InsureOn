from fastapi import APIRouter

from .. import schemas
from ..services.premium import get_onboarding_options

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.get("/options", response_model=schemas.OnboardingOptionsOut)
def onboarding_options():
    """Return frontend onboarding options sourced from backend pricing config."""
    return get_onboarding_options()
