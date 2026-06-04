"""
SmartWork Intelligence Report Generator
----------------------------------------
Transforms a single weekly tip into a comprehensive worker intelligence report.
All 5 sections are generated dynamically from available worker data.
"""

import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .. import models
from .. import crud
from .notification_service import create_notification
from .weather import get_weather_advisory
from .premium import (
    calculate_coverage,
    calculate_base_premium,
    calculate_final_premium,
    get_pricing_adjustments,
)

SURGE_EVENTS = [
    "Weekend evenings generally have 1.5–2× normal order volume",
    "Festival season: expect 2–3× surge on major holidays",
    "IPL / sports matches: food orders spike sharply during match hours",
    "Month-end weekends: higher spend, higher order value",
]

WEATHER_TEMPLATES = {
    "clear":  "Clear weather forecast — best earning window of the week.",
    "light":  "Light rain expected — surge pricing likely, worth staying out with rain gear.",
    "heavy":  "Heavy rain / storm forecast — avoid working during peak rain hours for safety.",
    "red":    "IMD Red Alert active in your zone — do NOT work during alert hours.",
    "orange": "IMD Orange Alert active — avoid working outdoors during alert hours.",
}


def _compute_confidence(has_profile: bool, has_risk_score: bool, has_weather: bool, has_earnings: bool) -> float:
    factors = [has_profile, has_risk_score, has_weather, has_earnings]
    return round(sum(1 for f in factors if f) / len(factors), 2)


def _project_earnings(avg_weekly_income: float, tier: str) -> float:
    if tier == "TIER_1":
        return round(avg_weekly_income * 1.12, 2)
    elif tier == "TIER_2":
        return round(avg_weekly_income * 1.10, 2)
    else:
        return round(avg_weekly_income + 1500, 2)


def _get_latest_imd_alert_for_zone(db: Session, zone: str) -> str:
    latest_trigger = (
        db.query(models.IMDTriggerEvent)
        .filter(models.IMDTriggerEvent.zone_triggered == zone)
        .order_by(models.IMDTriggerEvent.triggered_at.desc())
        .first()
    )
    if not latest_trigger:
        return "clear"
    alert_color = (latest_trigger.alert_color or "").strip().lower()
    if alert_color in WEATHER_TEMPLATES:
        return alert_color
    return "clear"


def _get_weather_advice(zone: str, imd_alert: str = "clear") -> str:
    if imd_alert in ("red", "orange"):
        return WEATHER_TEMPLATES.get(imd_alert, WEATHER_TEMPLATES["clear"])
    return WEATHER_TEMPLATES.get(imd_alert, WEATHER_TEMPLATES["clear"])


def _get_risk_advisory(zone: str, imd_alert: str = "clear") -> str:
    if imd_alert == "red":
        return "IMD RED Alert active in your zone — do NOT work during alert hours. Payout probability is elevated this week."
    if imd_alert == "orange" and zone == "A":
        return "IMD Orange Alert active in your zone — avoid working during alert hours. Keep insurance active."
    if imd_alert in ("heavy", "light"):
        return "Weather alert active — check your recommended slots for safe working hours."
    return "No active alerts in your zone this week."


def _build_recommended_slots(tier: str, zone: str, weather_risk: str) -> list[dict]:
    slots = []

    if weather_risk in ("HIGH", "SEVERE", "red", "orange"):
        slots.append({
            "time": "7 AM – 10 AM",
            "demand": "Moderate",
            "reason": "Early morning before weather worsens — safe window.",
        })
        slots.append({
            "time": "10 AM – 12 PM",
            "demand": "Low",
            "reason": "Weather may disrupt demand — consider indoor-adjacent zones.",
        })
    else:
        slots.append({
            "time": "7 PM – 10 PM",
            "demand": "High",
            "reason": "Dinner rush — peak order volume, higher tips expected.",
        })
        if zone in ("A", "B"):
            slots.append({
                "time": "12 PM – 2 PM",
                "demand": "High",
                "reason": "Lunch demand spike in commercial zones.",
            })
        else:
            slots.append({
                "time": "11 AM – 1 PM",
                "demand": "Moderate",
                "reason": "Pre-lunch orders in residential areas.",
            })

    if tier == "TIER_3":
        slots.append({
            "time": "Saturday 6 PM – 11 PM",
            "demand": "Very High",
            "reason": "Weekend surge — highest earning window of the week.",
        })
    else:
        slots.append({
            "time": "Saturday 12 PM – 5 PM",
            "demand": "High",
            "reason": "Weekend leisure orders — shorter distances, more deliveries.",
        })

    return slots


def _build_zones_advice(tier: str) -> list[str]:
    if tier == "TIER_3":
        return [
            "Weekday mornings/afternoons -> office and commercial zones (lunch + corporate orders)",
            "Weekday evenings -> residential and dining areas (dinner rush)",
            "Weekends -> high-footfall zones (shopping centres, entertainment districts)",
            "Avoid mid-afternoon (3-5 PM) — lowest order density, highest fuel cost per order",
        ]
    return [
        "Areas with high restaurant density (short distances, more orders/hr)",
        "Residential zones near commercial hubs (high drop-off demand)",
    ]


def _build_risk_outlook(
    risk_score: models.RiskScore | None,
    imd_alert: str,
    zone: str,
    weather: dict,
) -> dict | None:
    if not risk_score and imd_alert == "clear" and not weather.get("risk_level"):
        return None

    category = "LOW"
    if risk_score and risk_score.risk_category:
        category = risk_score.risk_category.value if hasattr(risk_score.risk_category, "value") else risk_score.risk_category

    warning_parts = []
    advice_parts = []

    weather_risk = weather.get("risk_level", "")
    if weather_risk in ("HIGH", "SEVERE"):
        warning_parts.append(f"{weather_risk} rainfall expected.")
        advice_parts.append("Avoid long-distance deliveries during peak rain hours.")
    elif imd_alert == "red":
        warning_parts.append("IMD Red Alert active.")
        advice_parts.append("Do not work during alert hours.")
    elif imd_alert == "orange":
        warning_parts.append("IMD Orange Alert active in your zone.")
        advice_parts.append("Avoid working outdoors during alert period.")

    if category == "HIGH":
        warning_parts.append("Your risk profile is elevated this week.")
        advice_parts.append("Stick to daytime shifts to keep risk score in check.")
    elif category == "VERY_HIGH":
        warning_parts.append("Your risk profile is very high this week.")
        advice_parts.append("Consider reducing weekly hours to lower your premium.")

    return {
        "category": category,
        "warning": " ".join(warning_parts) if warning_parts else "No active risks this week.",
        "advice": " ".join(advice_parts) if advice_parts else "Maintain your current work pattern.",
    }


def _build_premium_projection(
    db: Session,
    user: models.User | None,
    profile: models.WorkerProfile,
    risk_score: models.RiskScore | None,
) -> dict | None:
    if not profile or profile.weekly_premium is None or profile.weekly_premium == 0:
        return None

    current_premium = profile.weekly_premium
    income = profile.avg_weekly_income
    zone_val = profile.zone.value if hasattr(profile.zone, "value") else profile.zone

    projected_premium = current_premium
    impact = "Maintaining current work pattern keeps premiums stable."

    if risk_score and risk_score.risk_category:
        cat = risk_score.risk_category.value if hasattr(risk_score.risk_category, "value") else risk_score.risk_category
        is_multi = bool(profile.is_multi_platform)

        loadings, discounts = get_pricing_adjustments(
            is_multi_platform=is_multi,
            risk_category=risk_score.risk_category,
            pincode=profile.pincode,
        )

        if cat in ("HIGH", "VERY_HIGH"):
            improved_cat = models.RiskCategoryEnum.MEDIUM
            improved_loadings, improved_discounts = get_pricing_adjustments(
                is_multi_platform=is_multi,
                risk_category=improved_cat,
                pincode=profile.pincode,
            )
            coverage = calculate_coverage(profile.avg_weekly_hours, income)
            base = calculate_base_premium(profile.avg_weekly_hours, zone_val, income)
            projected_premium = calculate_final_premium(base, 1.00, improved_loadings, improved_discounts)
            impact = "Reducing risk category to MEDIUM may lower your premium."
        elif cat == "LOW":
            impact = "Your low risk profile keeps premiums minimal."
        else:
            coverage = calculate_coverage(profile.avg_weekly_hours, income)
            base = calculate_base_premium(profile.avg_weekly_hours, zone_val, income)
            projected_premium = calculate_final_premium(base, risk_score.multiplier, loadings, discounts)

    savings = round(current_premium - projected_premium, 2)

    return {
        "current_premium": current_premium,
        "projected_premium": projected_premium,
        "savings": savings,
        "impact": impact,
    }


def _get_demand_trend(zone: str, tier: str, weather_risk: str) -> str:
    base_pct = {"A": 10, "B": 7, "C": 4}.get(zone, 5)
    tier_mod = {"TIER_1": -2, "TIER_2": 0, "TIER_3": 3}.get(tier, 0)
    weather_penalty = 4 if weather_risk in ("HIGH", "SEVERE") else 0
    net = base_pct + tier_mod - weather_penalty
    direction = "increase" if net >= 0 else "decrease"
    return f"Demand expected to {direction} {abs(net)}% based on your zone and activity level."


def _build_city_insights(city: str, zone: str, weather: dict, tier: str, imd_alert: str = "clear") -> dict | None:
    if not city:
        return None

    if imd_alert == "red":
        weather_disruption = "High — IMD Red Alert active. Do not work during alert hours."
    elif imd_alert == "orange":
        weather_disruption = "High — IMD Orange Alert active. Avoid working outdoors during alert hours."
    else:
        weather_risk = weather.get("risk_level", "UNKNOWN")
        if weather_risk in ("HIGH", "SEVERE"):
            weather_disruption = "High — expect delivery delays."
        elif weather_risk == "MEDIUM":
            weather_disruption = "Moderate — plan around rain windows."
        else:
            weather_disruption = "Low — favorable conditions."

    peak_day = "Friday"
    if tier == "TIER_3":
        peak_day = "Saturday"

    demand_trend = _get_demand_trend(zone, tier, weather.get("risk_level", "UNKNOWN"))

    display_city = city.title()
    if weather_disruption.startswith("Low"):
        desc = f"{display_city} market: {demand_trend.lower().rstrip('.')}. Peak earning: {peak_day} evenings."
    else:
        desc = f"{display_city} market: {demand_trend.lower().rstrip('.')}. {weather_disruption} Peak earning: {peak_day} evenings."

    return {
        "city": display_city,
        "demand_trend": demand_trend,
        "weather_disruption_risk": weather_disruption,
        "peak_day": f"Peak demand expected {peak_day} evening.",
        "description": desc,
    }


def generate_weekly_tip(
    db: Session,
    user_id: int,
    imd_alert: str = "clear",
    send_notification: bool = True,
) -> models.SmartWorkTip:
    profile = crud.get_worker_profile(db, user_id)
    if not profile:
        raise ValueError(f"No profile found for user_id={user_id}")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    zone = profile.zone.value if hasattr(profile.zone, 'value') else profile.zone
    tier = profile.tier.value if hasattr(profile.tier, 'value') else profile.tier
    city_raw = (user.region or "").strip() if user else ""
    city = city_raw.title()

    resolved_imd = _get_latest_imd_alert_for_zone(db, zone) if imd_alert == "clear" else imd_alert
    weather_data = get_weather_advisory(city) if city else {}
    risk_score = crud.get_latest_risk_score(db, user_id)

    projected = _project_earnings(profile.avg_weekly_income, tier)
    recommended_slots = _build_recommended_slots(tier, zone, resolved_imd)
    risk_outlook = _build_risk_outlook(risk_score, resolved_imd, zone, weather_data)
    premium_projection = _build_premium_projection(db, user, profile, risk_score)
    city_insights = _build_city_insights(city, zone, weather_data, tier, resolved_imd)
    confidence = _compute_confidence(
        has_profile=True,
        has_risk_score=risk_score is not None,
        has_weather=bool(weather_data.get("risk_level") and weather_data["risk_level"] != "UNKNOWN"),
        has_earnings=profile.avg_weekly_income > 0,
    )

    best_slots = [s["time"] for s in recommended_slots]
    weather_advice = _get_weather_advice(zone, resolved_imd)
    risk_advisory_text = risk_outlook.get("warning", "") if risk_outlook else _get_risk_advisory(zone, resolved_imd)
    zones_advice = _build_zones_advice(tier)

    tip = crud.create_smartwork_tip(
        db=db, user_id=user_id, week_start_date=week_start,
        best_time_slots=json.dumps(best_slots),
        best_zones=json.dumps(zones_advice),
        weather_window=weather_advice,
        surge_alerts=json.dumps(SURGE_EVENTS[:2]),
        risk_advisory=risk_advisory_text,
        projected_earnings=projected,
        recommended_slots=json.dumps(recommended_slots),
        risk_outlook=json.dumps(risk_outlook) if risk_outlook else None,
        premium_projection=json.dumps(premium_projection) if premium_projection else None,
        city_insights=json.dumps(city_insights) if city_insights else None,
        confidence_score=confidence,
    )

    if send_notification:
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.title == "SmartWork Report Ready",
            models.Notification.notification_type == models.NotificationType.SMARTWORK_ALERT,
            models.Notification.created_at >= week_start,
        ).first()
        if not existing:
            create_notification(
                db, user_id,
                "SmartWork Report Ready",
                "Your weekly intelligence report is ready. Check earnings forecast, risk outlook, and more.",
                models.NotificationType.SMARTWORK_ALERT,
            )
    return tip


def generate_tips_for_all_workers(db: Session):
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
