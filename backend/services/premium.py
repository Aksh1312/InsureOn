"""
Premium & Coverage Calculator
-------------------------------
Zone rates:
  Zone A → 2.5% of coverage
  Zone B → 1.7% of coverage
  Zone C → 1.2% of coverage

Coverage = 70% of avg weekly income
Final Premium = base_premium × risk_multiplier

Tier assignment based on weekly working hours:
    Tier 1 → 10–25 hrs/week
    Tier 2 → 26–40 hrs/week
    Tier 3 → 41+ hrs/week
"""

from .. import models

ZONE_RATES = {
    "A": 0.025,
    "B": 0.017,
    "C": 0.012,
}

MAX_WEEKLY_INCOME = 12000
COVERAGE_RATIO = 0.70  # 70% of avg weekly income

# Loading & discount factors
LOADINGS = {
    "coastal_pincode":     0.25,   # +25% for flood-prone pincode
    "short_waiting":       0.15,   # +15% for 12hr waiting period
}
DISCOUNTS = {
    "no_claim_6_months":   0.10,   # -10%
    "multi_platform":      0.05,   # -5%
    "annual_upfront":      0.08,   # -8%
    "safe_worker":         0.05,   # -5% SmartWork reward
    "low_risk_score":      0.15,   # -15%
}

COASTAL_PIN_PREFIXES = {
    "400",  # Mumbai
    "600",  # Chennai
    "682",  # Kochi
    "530",  # Vizag
    "751",  # Bhubaneswar
    "700",  # Kolkata
}

ZONE_CITY_MAP = {
    "A": ["chennai", "mumbai", "kolkata", "kochi", "bhubaneswar", "vizag"],
    "B": ["bengaluru", "bangalore", "hyderabad", "ahmedabad", "surat", "nagpur"],
    "C": ["delhi", "pune", "jaipur", "lucknow", "chandigarh", "indore"],
}


def get_onboarding_options() -> dict:
    return {
        "platforms": [platform.value for platform in models.PlatformEnum],
        "shifts": [shift.value for shift in models.WorkShiftEnum],
        "zone_cities": ZONE_CITY_MAP,
        "zone_rates": ZONE_RATES,
    }

def assign_tier(avg_weekly_hours: float) -> models.TierEnum:
    if avg_weekly_hours <= 25:
        return models.TierEnum.TIER_1
    elif avg_weekly_hours <= 40:
        return models.TierEnum.TIER_2
    else:
        return models.TierEnum.TIER_3

def assign_zone(region: str) -> models.ZoneEnum:
    """
    Map city/region to zone.
    Extend this dict as you onboard more cities.
    """
    r = region.strip().lower()
    if r in ZONE_CITY_MAP["A"]:
        return models.ZoneEnum.A
    elif r in ZONE_CITY_MAP["B"]:
        return models.ZoneEnum.B
    else:
        return models.ZoneEnum.C  # default to low risk if unknown


def _is_coastal_pincode(pincode: str | None) -> bool:
    if not pincode:
        return False
    return pincode[:3] in COASTAL_PIN_PREFIXES

def get_pricing_adjustments(
    *,
    is_multi_platform: bool,
    risk_category: models.RiskCategoryEnum,
    pincode: str | None = None,
    has_no_claims: bool = False,
    safe_worker: bool = False,
    annual_upfront: bool = False,
    short_waiting_period: bool = False,
) -> tuple[list[str], list[str]]:
    loadings: list[str] = []
    discounts: list[str] = []

    if _is_coastal_pincode(pincode):
        loadings.append("coastal_pincode")

    if short_waiting_period:
        loadings.append("short_waiting")

    if is_multi_platform:
        discounts.append("multi_platform")

    if has_no_claims:
        discounts.append("no_claim_6_months")

    if safe_worker:
        discounts.append("safe_worker")

    if annual_upfront:
        discounts.append("annual_upfront")

    if risk_category == models.RiskCategoryEnum.LOW:
        discounts.append("low_risk_score")

    return loadings, discounts

def calculate_coverage(avg_weekly_income: float) -> float:
    """70% of average weekly income (capped), rounded to nearest ₹50."""
    capped_income = min(avg_weekly_income, MAX_WEEKLY_INCOME)
    raw = capped_income * COVERAGE_RATIO
    return round(raw / 50) * 50

def calculate_base_premium(coverage: float, zone: str) -> float:
    """Base premium = zone rate × coverage, rounded to nearest ₹5."""
    rate = ZONE_RATES.get(zone, 0.017)
    raw  = coverage * rate
    return round(raw / 5) * 5

def calculate_final_premium(
    base_premium: float,
    risk_multiplier: float,
    applied_loadings: list[str] = None,
    applied_discounts: list[str] = None,
) -> float:
    """
    Apply risk multiplier, then loadings, then discounts.
    applied_loadings / applied_discounts: list of keys from LOADINGS / DISCOUNTS dicts
    """
    premium = base_premium * risk_multiplier

    if applied_loadings:
        for key in applied_loadings:
            if key in LOADINGS:
                premium *= (1 + LOADINGS[key])

    if applied_discounts:
        for key in applied_discounts:
            if key in DISCOUNTS:
                premium *= (1 - DISCOUNTS[key])

    return round(premium / 5) * 5  # round to nearest ₹5

def get_full_premium_breakdown(
    avg_weekly_income: float,
    avg_weekly_hours: float,
    region: str,
    risk_multiplier: float,
    risk_category: models.RiskCategoryEnum | None = None,
    is_multi_platform: bool = False,
    pincode: str | None = None,
    has_no_claims: bool = False,
    safe_worker: bool = False,
    annual_upfront: bool = False,
    short_waiting_period: bool = False,
    applied_loadings: list[str] = None,
    applied_discounts: list[str] = None,
) -> dict:
    """
    Returns full breakdown dict — useful for API response.
    """
    zone     = assign_zone(region)
    tier     = assign_tier(avg_weekly_hours)
    coverage = calculate_coverage(avg_weekly_income)
    base     = calculate_base_premium(coverage, zone.value)
    if applied_loadings is None or applied_discounts is None:
        loadings, discounts = get_pricing_adjustments(
            is_multi_platform=is_multi_platform,
            risk_category=risk_category or models.RiskCategoryEnum.MEDIUM,
            pincode=pincode,
            has_no_claims=has_no_claims,
            safe_worker=safe_worker,
            annual_upfront=annual_upfront,
            short_waiting_period=short_waiting_period,
        )
        applied_loadings = loadings
        applied_discounts = discounts

    final    = calculate_final_premium(base, risk_multiplier, applied_loadings, applied_discounts)

    return {
        "zone":            zone.value,
        "tier":            tier.value,
        "avg_weekly_hours": avg_weekly_hours,
        "avg_weekly_income": avg_weekly_income,
        "weekly_coverage": coverage,
        "base_premium":    base,
        "risk_multiplier": risk_multiplier,
        "weekly_premium":  final,
        "applied_loadings":  applied_loadings or [],
        "applied_discounts": applied_discounts or [],
    }
