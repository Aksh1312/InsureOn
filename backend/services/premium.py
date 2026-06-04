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

from typing import Optional
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
    "coastal_pincode":     0.25,   # +25% for flood-prone pincode (20-30% as per README)
    "short_waiting":       0.15,   # +15% for 12hr waiting period
    "very_high_risk":      0.40,   # +40% for Very High risk category
}
DISCOUNTS = {
    "no_claim_6_months":   0.10,   # -10%
    "multi_platform":      0.05,   # -5%
    "annual_upfront":      0.08,   # -8%
    "safe_worker":         0.05,   # -5% SmartWork reward
    "low_risk_score":      0.15,   # -15%
}

# README pricing tables — exact band-based lookup for the calculator
# Each entry: (max_hours, coverage, zone_a, zone_b, zone_c)
# Tier progression: 1a→1c (10-25h), 2a→2c (26-40h), 3a→3d (41+)
README_BANDS = [
    (15, 1400, 35, 25, 15),    # Tier 1a — 10-15h
    (20, 2100, 50, 35, 25),    # Tier 1b — 16-20h
    (25, 2800, 70, 50, 35),    # Tier 1c — 21-25h
    (30, 3500, 90, 60, 40),    # Tier 2a — 26-30h
    (35, 4300, 110, 75, 50),   # Tier 2b — 31-35h
    (40, 5150, 130, 90, 60),   # Tier 2c — 36-40h
    (50, 6100, 150, 105, 75),  # Tier 3a — 41-50h
    (60, 7150, 180, 120, 85),  # Tier 3b — 51-60h
    (70, 8050, 200, 135, 95),  # Tier 3c — 61-70h
    (999, 8400, 210, 145, 100), # Tier 3d — 71+h
]  # fmt: skip

ZONE_LOOKUP = {"A": 2, "B": 3, "C": 4}  # indexes into README_BANDS tuples

def get_readme_band(hours: float) -> tuple:
    """Return (coverage, zone_a_premium, zone_b_premium, zone_c_premium)
    for the README pricing band matching the given hours."""
    for band in README_BANDS:
        if hours <= band[0]:
            return (band[1], band[2], band[3], band[4])
    return README_BANDS[-1]

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

    if risk_category == models.RiskCategoryEnum.VERY_HIGH:
        loadings.append("very_high_risk")

    return loadings, discounts

def calculate_coverage(avg_weekly_hours: float, avg_weekly_income: Optional[float] = None) -> float:
    """Calculate weekly coverage. If avg_weekly_income is provided, coverage is 70% of it, 
    capped at 12000/week (max coverage 8400). Otherwise, falls back to README band lookup."""
    if avg_weekly_income is not None:
        effective_income = min(avg_weekly_income, 12000.0)
        return round(effective_income * 0.70, 2)
    band = get_readme_band(avg_weekly_hours)
    return float(band[0])


def calculate_base_premium(avg_weekly_hours: float, zone: str, avg_weekly_income: Optional[float] = None) -> float:
    """Calculate base premium. If avg_weekly_income is provided, base premium is calculated 
    based on the zone rate percentage of the coverage. Otherwise, falls back to README band lookup."""
    if avg_weekly_income is not None:
        coverage = calculate_coverage(avg_weekly_hours, avg_weekly_income)
        z = zone.strip().upper()
        rate = ZONE_RATES.get(z, 0.012)
        return round(coverage * rate, 2)
    
    band = get_readme_band(avg_weekly_hours)
    z = zone.strip().upper()
    if z == "A":
        return float(band[1])
    elif z == "B":
        return float(band[2])
    else:
        return float(band[3])


def calculate_final_premium(
    base_premium: float,
    risk_multiplier: float = 1.0,
    applied_loadings: list[str] = None,
    applied_discounts: list[str] = None,
) -> float:
    """Bypasses risk category multipliers, loadings, and discounts, returning the base premium directly."""
    return base_premium


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
    Simplified to strictly average weekly hours and automatically determined zone,
    bypassing loadings, discounts and multipliers.
    """
    zone     = assign_zone(region)
    tier     = assign_tier(avg_weekly_hours)
    coverage = calculate_coverage(avg_weekly_hours, avg_weekly_income)
    base     = calculate_base_premium(avg_weekly_hours, zone.value, avg_weekly_income)

    return {
        "zone":            zone.value,
        "tier":            tier.value,
        "avg_weekly_hours": avg_weekly_hours,
        "avg_weekly_income": avg_weekly_income,
        "weekly_coverage": coverage,
        "base_premium":    base,
        "risk_multiplier": 1.0,
        "weekly_premium":  base,
        "applied_loadings":  [],
        "applied_discounts": [],
    }


