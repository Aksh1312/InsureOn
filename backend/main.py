from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager

from .db import SessionLocal, engine
from . import models
from .auth import hash_password, verify_password
from .dependencies import get_db, get_current_user, create_access_token
from . import schemas

# Routers
from .routers import workers, policies, claims, payouts

# Services
from .services.imd import run_imd_poll
from .services.claims import run_daily_income_check
from .services.smartwork import generate_tips_for_all_workers

# ─────────────────────────────────────────────
# CREATE ALL TABLES
# ─────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)


# ─────────────────────────────────────────────
# SCHEDULER SETUP
# ─────────────────────────────────────────────
scheduler = AsyncIOScheduler()

def _get_db_for_scheduler():
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # scheduler jobs manage their own session lifecycle

async def scheduled_imd_poll():
    """Runs every 15 minutes — polls IMD APIs and opens claims on alerts."""
    db = SessionLocal()
    try:
        await run_imd_poll(db)
    finally:
        db.close()

def scheduled_income_check():
    """Runs every midnight — checks daily income for all monitoring claims."""
    db = SessionLocal()
    try:
        run_daily_income_check(db)
    finally:
        db.close()

def scheduled_smartwork_tips():
    """Runs every Monday 8 AM — generates SmartWork tips for all workers."""
    db = SessionLocal()
    try:
        generate_tips_for_all_workers(db)
    finally:
        db.close()


# ─────────────────────────────────────────────
# LIFESPAN — start/stop scheduler with app
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # IMD poller — every 15 minutes
    scheduler.add_job(
        scheduled_imd_poll,
        IntervalTrigger(minutes=15),
        id="imd_poll",
        replace_existing=True,
    )
    # Daily income check — every midnight
    scheduler.add_job(
        scheduled_income_check,
        CronTrigger(hour=0, minute=0),
        id="daily_income_check",
        replace_existing=True,
    )
    # SmartWork tips — every Monday at 8 AM
    scheduler.add_job(
        scheduled_smartwork_tips,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="smartwork_tips",
        replace_existing=True,
    )
    scheduler.start()
    print("Scheduler started — IMD poll every 15 min, income check at midnight, SmartWork every Monday 8 AM")
    yield
    scheduler.shutdown()
    print("Scheduler stopped")


# ─────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────
app = FastAPI(
    title="InsureOn API",
    description="Parametric income protection insurance for gig delivery workers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.post("/signup", response_model=schemas.TokenResponse, tags=["Auth"])
def signup(body: schemas.SignupRequest, db: Session = Depends(get_db)):
    """Register a new worker account."""
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=body.email,
        hashed_password=hash_password(body.password),
        platform=body.platform,
        region=body.region,
        income=body.income,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login with email and password. Returns JWT token."""
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
    """Get the currently authenticated worker's details."""
    return current_user


# ─────────────────────────────────────────────
# REGISTER ALL ROUTERS
# ─────────────────────────────────────────────
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(payouts.router)


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "InsureOn API"}
