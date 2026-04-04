from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from datetime import date, timedelta
import logging
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager

from .db import SessionLocal, engine, apply_legacy_schema_patches
from . import models, crud
from .auth import hash_password, verify_password
from .dependencies import get_db, get_current_user, create_access_token
from . import schemas

# Routers
from .routers import workers, policies, claims, payouts
from .routers import dashboard
from .routers import onboarding

# Services
from .services.imd import run_imd_poll
from .services.claims import run_daily_income_check
from .services.smartwork import generate_tips_for_all_workers
from .services.risk import calculate_and_save_risk_score
from .services.weekly import run_weekly_repricing
from .services.premium import (
    assign_zone,
    assign_tier,
    calculate_coverage,
    calculate_base_premium,
    calculate_final_premium,
    get_pricing_adjustments,
)

# ─────────────────────────────────────────────
# CREATE ALL DB TABLES ON STARTUP
# ─────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)
apply_legacy_schema_patches()


# ─────────────────────────────────────────────
# SCHEDULER JOBS
# ─────────────────────────────────────────────
scheduler = AsyncIOScheduler()

async def scheduled_imd_poll():
    """Every 15 minutes — polls IMD APIs, fires claim triggers on Red/Orange alerts."""
    db = SessionLocal()
    try:
        await run_imd_poll(db)
    finally:
        db.close()

def scheduled_income_check():
    """Every midnight — checks daily income for all claims in MONITORING status."""
    db = SessionLocal()
    try:
        run_daily_income_check(db)
    finally:
        db.close()

def scheduled_smartwork_tips():
    """Every Monday 8 AM — generates SmartWork tips for all active workers."""
    db = SessionLocal()
    try:
        generate_tips_for_all_workers(db)
    finally:
        db.close()

def scheduled_weekly_repricing():
    """Every Monday 6 AM — recalculates risk, premium, and issues the weekly policy."""
    db = SessionLocal()
    try:
        run_weekly_repricing(db)
    finally:
        db.close()


def bootstrap_existing_users():
    """Fill in missing onboarding records for older local accounts."""
    db = SessionLocal()
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        for user in db.query(models.User).all():
            profile = crud.get_worker_profile(db, user.id)
            if not profile:
                avg_weekly_hours = 22.0
                zone = assign_zone(user.region)
                tier = assign_tier(avg_weekly_hours)
                avg_daily_income = round(user.income / 6, 2)
                coverage = calculate_coverage(user.income)
                base_premium = calculate_base_premium(coverage, zone.value)

                crud.create_worker_profile(
                    db=db,
                    user_id=user.id,
                    zone=zone.value,
                    tier=tier.value,
                    pincode="000000",
                    avg_weekly_hours=avg_weekly_hours,
                    avg_weekly_income=user.income,
                    avg_daily_income=avg_daily_income,
                    primary_shift=models.WorkShiftEnum.AFTERNOON.value,
                    is_multi_platform=False,
                    weekly_coverage=coverage,
                    weekly_premium=base_premium,
                )
                profile = crud.get_worker_profile(db, user.id)

                risk = calculate_and_save_risk_score(db, user.id)
                has_no_claims = True
                safe_worker = False
                loadings, discounts = get_pricing_adjustments(
                    is_multi_platform=bool(profile.is_multi_platform),
                    risk_category=risk.risk_category,
                    pincode=profile.pincode,
                    has_no_claims=has_no_claims,
                    safe_worker=safe_worker,
                )
                final_premium = calculate_final_premium(
                    base_premium,
                    risk.multiplier,
                    applied_loadings=loadings,
                    applied_discounts=discounts,
                )
                profile = crud.update_worker_profile(db, user.id, weekly_premium=final_premium)

            existing_policy = db.query(models.Policy).filter(
                models.Policy.user_id == user.id,
                models.Policy.week_start_date == week_start,
            ).first()

            if not existing_policy and profile:
                policy = crud.create_policy(
                    db=db,
                    user_id=user.id,
                    week_start_date=week_start,
                    zone=profile.zone.value,
                    tier=profile.tier.value,
                    weekly_coverage=profile.weekly_coverage,
                    weekly_premium=profile.weekly_premium,
                )
                crud.mark_policy_paid(db, policy.id)

            if profile:
                try:
                    if not crud.get_latest_smartwork_tip(db, user.id):
                        from .services.smartwork import generate_weekly_tip
                        generate_weekly_tip(db, user.id)
                except Exception:
                    pass
    finally:
        db.close()


# ─────────────────────────────────────────────
# APP LIFESPAN — start/stop scheduler
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        scheduled_imd_poll,
        IntervalTrigger(minutes=15),
        id="imd_poll",
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_income_check,
        CronTrigger(hour=0, minute=0),
        id="daily_income_check",
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_smartwork_tips,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="smartwork_tips",
        replace_existing=True,
    )
    scheduler.add_job(
        scheduled_weekly_repricing,
        CronTrigger(day_of_week="mon", hour=6, minute=0),
        id="weekly_repricing",
        replace_existing=True,
    )
    scheduler.start()
    bootstrap_existing_users()
    print("✅ Scheduler started")
    print("   → IMD poll every 15 min")
    print("   → Income check every midnight")
    print("   → SmartWork tips every Monday 8 AM")
    print("   → Weekly repricing every Monday 6 AM")
    yield
    scheduler.shutdown()
    print("Scheduler stopped")


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
app = FastAPI(
    title="InsureOn API",
    description="Parametric income protection insurance for gig delivery workers",
    version="1.0.0",
    lifespan=lifespan,
)

logger = logging.getLogger("uvicorn.error")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "422 validation error on %s %s | errors=%s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.post("/signup", response_model=schemas.TokenResponse, tags=["Auth"])
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    """Register a new worker. Returns JWT token on success."""
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        full_name=body.full_name or body.email.split("@")[0],
        email=body.email,
        hashed_password=hash_password(body.password),
        platform=body.platform,
        region=body.region,
        income=body.income,
        upi_id=body.upi_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    zone = assign_zone(user.region)
    avg_weekly_hours = body.avg_weekly_hours or 22.0
    tier = assign_tier(avg_weekly_hours)
    avg_daily_income = round(user.income / 6, 2)
    coverage = calculate_coverage(user.income)
    base_premium = calculate_base_premium(coverage, zone.value)
    risk_score = None

    profile = crud.create_worker_profile(
        db=db,
        user_id=user.id,
        zone=zone.value,
        tier=tier.value,
        pincode=body.pincode,
        avg_weekly_hours=avg_weekly_hours,
        avg_weekly_income=user.income,
        avg_daily_income=avg_daily_income,
        primary_shift=(body.primary_shift or models.WorkShiftEnum.AFTERNOON).value,
        is_multi_platform=bool(body.is_multi_platform),
        weekly_coverage=coverage,
        weekly_premium=base_premium,
    )

    risk_score = calculate_and_save_risk_score(db, user.id)
    loadings, discounts = get_pricing_adjustments(
        is_multi_platform=bool(body.is_multi_platform),
        risk_category=risk_score.risk_category,
        pincode=body.pincode,
        has_no_claims=True,
        safe_worker=False,
    )
    final_premium = calculate_final_premium(
        base_premium,
        risk_score.multiplier,
        applied_loadings=loadings,
        applied_discounts=discounts,
    )
    profile = crud.update_worker_profile(db, user.id, weekly_premium=final_premium)

    policy = crud.create_policy(
        db=db,
        user_id=user.id,
        week_start_date=(date.today() - timedelta(days=date.today().weekday())),
        zone=zone.value,
        tier=tier.value,
        weekly_coverage=coverage,
        weekly_premium=final_premium,
    )
    crud.mark_policy_paid(db, policy.id)

    try:
        from .services.smartwork import generate_weekly_tip
        generate_weekly_tip(db, user.id)
    except Exception:
        pass

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login with email + password. Returns JWT token."""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me", response_model=schemas.UserOut, tags=["Auth"])
def get_me(current_user: models.User = Depends(get_current_user)):
    """Get the currently authenticated worker's profile."""
    return current_user


# ─────────────────────────────────────────────
# REGISTER ROUTERS
# ─────────────────────────────────────────────
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(payouts.router)
app.include_router(dashboard.router)
app.include_router(onboarding.router)


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "InsureOn API", "version": "1.0.0"}


# ─────────────────────────────────────────────
# SERVE REACT FRONTEND (SPA)
# ─────────────────────────────────────────────
_static_dir = Path(__file__).parent / "static"

if _static_dir.exists():
    # Serve static assets (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=_static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Catch-all: return index.html so React Router handles client-side routing."""
        index = _static_dir / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"detail": "Frontend not built. Run `npm run build` in /frontend first."}
