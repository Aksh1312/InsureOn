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
from .routers import workers, policies, claims, payouts, admin

# Services
from .services.imd import run_imd_poll
from .services.claims import run_daily_income_check
from .services.smartwork import generate_tips_for_all_workers

# ─────────────────────────────────────────────
# CREATE ALL DB TABLES ON STARTUP
# ─────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)


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
    scheduler.start()
    print("✅ Scheduler started")
    print("   → IMD poll every 15 min")
    print("   → Income check every midnight")
    print("   → SmartWork tips every Monday 8 AM")
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
app.include_router(admin.router)


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "InsureOn API", "version": "1.0.0"}
