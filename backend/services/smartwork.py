"""
SmartWork Tip Generator
-------------------------
Generates weekly personalized tips for each worker every Monday.
Data sources: platform order history, IMD forecast, city event calendar.
"""

import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
import models
import crud

# Peak hours by day type
PEAK_SLOTS = {
    "weekday": ["7:00 PM – 9:00 PM (dinner rush)", "12:00 PM – 2:00 PM (lunch peak)"],
    "weekend": ["7:00 PM – 10:00 PM (highest surge)", "12:00 PM – 3:00 PM (lunch + leisure)"],
}

# High earning zone characteristics
HIGH_EARNING_ZONES = [
    "Areas with high restaurant density (short distances, more orders/hr)",
    "Residential zones near commercial hubs (high drop-off demand)",
    "IT parks and office clusters on weekdays (corporate orders)",
    "Shopping districts and malls on weekends",
]

# Weather advice templates
WEATHER_TEMPLATES = {
    "clear":  "Clear weather forecast — best earning window of the week.",
    "light":  "Light rain expected — surge pricing likely, worth staying out with rain gear.",
    "heavy":  "Heavy rain / storm forecast — avoid working during peak rain hours for safety.",
    "red":    "⚠️ IMD Red Alert active in your zone — do NOT work during alert hours.",
    "orange": "⚠️ IMD Orange Alert active — Zone A workers should avoid working today.",
}

# Surge event types
SURGE_EVENTS = [
    "Weekend evenings generally have 1.5–2× normal order volume",
    "Festival season: expect 2–3× surge on major holidays",
    "IPL / sports matches: food orders spike sharply during match hours",
    "Month-end weekends: higher spend, higher order value",
]


def _get_weather_advice(zone: str, imd_alert: str = "clear") -> str:
    """
    TODO: Replace imd_alert with real IMD API call for the worker's district.
    zone: "A", "B", or "C"
    imd_alert: "clear", "light", "heavy", "red", "orange"
    """
    if imd_alert == "red":
        return WEATHER_TEMPLATES["red"]
    if imd_alert == "orange" and zone == "A":
        return WEATHER_TEMPLATES["orange"]
    return WEATHER_TEMPLATES.get(imd_alert, WEATHER_TEMPLATES["clear"])


def _get_risk_advisory(zone: str, imd_alert: str = "clear") -> str:
    if imd_alert in ("red", "orange") and zone == "A":
        return "Active IMD alert in your zone — avoid working during alert hours. Keep insurance active — payout probability is high this week."
    return "No active alerts in your zone this week. Good week to maximize earnings."


def _project_earnings(avg_weekly_income: float, tier: str) -> float:
    """
    Project earnings if worker follows SmartWork tips.
    Part-time: +10–15% | Full-time: +₹1,000–₹2,000 from zone rotation
    """
    if tier == "TIER_1":
        return round(avg_weekly_income * 1.12, 2)   # +12%
    elif tier == "TIER_2":
        return round(avg_weekly_income * 1.10, 2)   # +10%
    else:
        return round(avg_weekly_income + 1500, 2)   # flat ₹1,500 boost


def generate_weekly_tip(
    db: Session,
    user_id: int,
    imd_alert: str = "clear",     # replace with real IMD call
) -> models.SmartWorkTip:
    """
    Generate and save this week's SmartWork tip for a worker.
    Call every Monday for all active workers.
    """
    profile = crud.get_worker_profile(db, user_id)
    if not profile:
        raise ValueError(f"No profile found for user_id={user_id}")

    today       = date.today()
    week_start  = today - timedelta(days=today.weekday())  # Monday

    zone = profile.zone.value if hasattr(profile.zone, 'value') else profile.zone
    tier = profile.tier.value if hasattr(profile.tier, 'value') else profile.tier

    # Build tip content
    best_slots = PEAK_SLOTS["weekday"] + PEAK_SLOTS["weekend"]

    if tier == "TIER_3":
        # Full-time workers: zone rotation strategy
        zones_advice = [
            "Weekday mornings/afternoons → office and commercial zones (lunch + corporate orders)",
            "Weekday evenings → residential and dining areas (dinner rush)",
            "Weekends → high-footfall zones (shopping centres, entertainment districts)",
            "Avoid mid-afternoon (3–5 PM) — lowest order density, highest fuel cost per order",
        ]
    else:
        zones_advice = HIGH_EARNING_ZONES[:2]

    weather_advice = _get_weather_advice(zone, imd_alert)
    risk_advisory  = _get_risk_advisory(zone, imd_alert)
    projected      = _project_earnings(profile.avg_weekly_income, tier)

    tip = crud.create_smartwork_tip(
        db=db,
        user_id=user_id,
        week_start_date=week_start,
        best_time_slots=json.dumps(best_slots),
        best_zones=json.dumps(zones_advice),
        weather_window=weather_advice,
        surge_alerts=json.dumps(SURGE_EVENTS[:2]),
        risk_advisory=risk_advisory,
        projected_earnings=projected,
    )
    return tip


def generate_tips_for_all_workers(db: Session):
    """
    Call every Monday via scheduler.
    Generates tips for every active worker.
    """
    active_workers = db.query(models.WorkerProfile).all()
    count = 0
    for profile in active_workers:
        try:
            generate_weekly_tip(db, profile.user_id)
            count += 1
        except Exception as e:
            print(f"SmartWork tip failed for user_id={profile.user_id}: {e}")
    print(f"SmartWork tips generated for {count} workers")
    return count
