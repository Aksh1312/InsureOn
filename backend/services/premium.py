"""
Premium & Coverage Calculator
-------------------------------
Zone rates:
  Zone A → 2.5% of coverage
  Zone B → 1.7% of coverage
  Zone C → 1.2% of coverage

Coverage = 70% of avg weekly income
Final Premium = base_premium × risk_multiplier

Tier assignment based on weekly income:
  Tier 1 → ₹1,500–₹4,500
  Tier 2 → ₹4,501–₹8,000
  Tier 3 → ₹8,001–₹12,000+
"""

from .. import models

ZONE_RATES = {
    "A": 0.025,
    "B": 0.017,
    "C": 0.012,
}

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

def assign_tier(avg_weekly_income: float) -> models.TierEnum:
    if avg_weekly_income <= 4500:
        return models.TierEnum.TIER_1
    elif avg_weekly_income <= 8000:
        return models.TierEnum.TIER_2
    else:
        return models.TierEnum.TIER_3

def assign_zone(region: str) -> models.ZoneEnum:
    """
    Map city/region to zone.
    Extend this dict as you onboard more cities.
    """
    zone_a = ["chennai", "mumbai", "kolkata", "kochi", "bhubaneswar", "vizag"]
    zone_b = ["bengaluru", "bangalore", "hyderabad", "ahmedabad", "surat", "nagpur"]
    zone_c = ["delhi", "pune", "jaipur", "lucknow", "chandigarh", "indore"]

    r = region.strip().lower()
    if r in zone_a:
        return models.ZoneEnum.A
    elif r in zone_b:
        return models.ZoneEnum.B
    else:
        return models.ZoneEnum.C  # default to low risk if unknown

def calculate_coverage(avg_weekly_income: float) -> float:
    """70% of average weekly income, rounded to nearest ₹50."""
    raw = avg_weekly_income * COVERAGE_RATIO
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
    region: str,
    risk_multiplier: float,
    applied_loadings: list[str] = None,
    applied_discounts: list[str] = None,
) -> dict:
    """
    Returns full breakdown dict — useful for API response.
    """
    zone     = assign_zone(region)
    tier     = assign_tier(avg_weekly_income)
    coverage = calculate_coverage(avg_weekly_income)
    base     = calculate_base_premium(coverage, zone.value)
    final    = calculate_final_premium(base, risk_multiplier, applied_loadings, applied_discounts)

    return {
        "zone":            zone.value,
        "tier":            tier.value,
        "avg_weekly_income": avg_weekly_income,
        "weekly_coverage": coverage,
        "base_premium":    base,
        "risk_multiplier": risk_multiplier,
        "weekly_premium":  final,
        "applied_loadings":  applied_loadings or [],
        "applied_discounts": applied_discounts or [],
    }
