"""
Weekly Repricing & Policy Issuance
---------------------------------
Runs every Monday to keep worker profiles, premiums, and policies in sync.
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session

from .. import models, crud
from .risk import calculate_and_save_risk_score
from .premium import (
    assign_zone,
    assign_tier,
    calculate_coverage,
    calculate_base_premium,
    calculate_final_premium,
    get_pricing_adjustments,
)


def run_weekly_repricing(db: Session, *, issue_policies: bool = True, mark_paid: bool = True) -> dict:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    updated_profiles = 0
    policies_issued = 0

    workers = db.query(models.User).filter(models.User.is_active == True).all()
    for user in workers:
        profile = crud.get_worker_profile(db, user.id)
        if not profile:
            continue

        zone = assign_zone(user.region)
        tier = assign_tier(profile.avg_weekly_hours)
        weekly_income = profile.avg_weekly_income or float(user.income)
        avg_daily_income = round(weekly_income / 6, 2)
        coverage = calculate_coverage(weekly_income)
        base_premium = calculate_base_premium(coverage, zone.value)

        crud.update_worker_profile(
            db,
            user.id,
            zone=zone.value,
            tier=tier.value,
            avg_weekly_income=weekly_income,
            avg_daily_income=avg_daily_income,
            weekly_coverage=coverage,
        )

        risk = calculate_and_save_risk_score(db, user.id)
        six_months_ago = today - timedelta(days=180)
        has_no_claims = crud.count_closed_claims_since(db, user.id, six_months_ago) == 0
        latest_tip = crud.get_latest_smartwork_tip(db, user.id)
        safe_worker = bool(latest_tip and latest_tip.followed_safety_tips)

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
        crud.update_worker_profile(db, user.id, weekly_premium=final_premium)
        updated_profiles += 1

        if issue_policies:
            existing_policy = db.query(models.Policy).filter(
                models.Policy.user_id == user.id,
                models.Policy.week_start_date == week_start,
            ).first()
            if not existing_policy:
                policy = crud.create_policy(
                    db=db,
                    user_id=user.id,
                    week_start_date=week_start,
                    zone=zone.value,
                    tier=tier.value,
                    weekly_coverage=coverage,
                    weekly_premium=final_premium,
                )
                if mark_paid:
                    crud.mark_policy_paid(db, policy.id)
                policies_issued += 1

    return {
        "updated_profiles": updated_profiles,
        "policies_issued": policies_issued,
        "week_start": week_start.isoformat(),
    }
