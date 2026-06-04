"""
IMD Trigger Monitoring Service
--------------------------------
Runs every 15 minutes via APScheduler.
Calls IMD District Warnings + Nowcast APIs.
Fires claim triggers for matching zones.

IMD API docs:
  Warnings : https://city.imd.gov.in/citywx/warnings_district_api.php?id={obj_id}
  Nowcast  : https://city.imd.gov.in/citywx/nowcast_district_api.php?id={obj_id}

Alert color logic:
  RED    → trigger for ALL zones (A, B, C)
  ORANGE → trigger for Zone A only
  YELLOW → no trigger, log only
  GREEN  → no action
"""

import httpx
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .. import models
from .. import crud
from .audit import lifecycle_log, audit_error
from .tracing import record_eligibility
from .notification_service import create_notification
from .smartwork import generate_weekly_tip

DISTRICT_MAP = [
    {"district": "Chennai",    "obj_id": 573, "zone": "A"},
    {"district": "Mumbai",     "obj_id": 312, "zone": "A"},
    {"district": "Kolkata",    "obj_id": 489, "zone": "A"},
    {"district": "Bengaluru",  "obj_id": 201, "zone": "B"},
    {"district": "Hyderabad",  "obj_id": 198, "zone": "B"},
    {"district": "Ahmedabad",  "obj_id": 142, "zone": "B"},
    {"district": "Delhi",      "obj_id": 164, "zone": "C"},
    {"district": "Pune",       "obj_id": 387, "zone": "C"},
    {"district": "Jaipur",     "obj_id": 291, "zone": "C"},
]

IMD_BASE  = "https://city.imd.gov.in/citywx"
FALLBACK  = "https://weather.indianapi.in"
FALLBACK_API_KEY = os.getenv("FALLBACK_API_KEY", "")


def _parse_alert_color(api_response: dict) -> str:
    try:
        color_code = api_response.get("color", 4)
        return {1: "RED", 2: "ORANGE", 3: "YELLOW", 4: "GREEN"}.get(int(color_code), "GREEN")
    except Exception:
        return "GREEN"


def _should_trigger(alert_color: str, zone: str) -> bool:
    if alert_color == "RED":
        return True
    if alert_color == "ORANGE" and zone == "A":
        return True
    return False


async def poll_imd_district(obj_id: int) -> str:
    warnings_url = f"{IMD_BASE}/warnings_district_api.php?id={obj_id}"
    nowcast_url  = f"{IMD_BASE}/nowcast_district_api.php?id={obj_id}"

    severity_order = {"RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            w_resp = await client.get(warnings_url)
            n_resp = await client.get(nowcast_url)

        w_color = _parse_alert_color(w_resp.json() if w_resp.status_code == 200 else {})
        n_color = _parse_alert_color(n_resp.json() if n_resp.status_code == 200 else {})

        return w_color if severity_order[w_color] <= severity_order[n_color] else n_color

    except Exception as e:
        print(f"[IMD] API error for obj_id={obj_id}: {e}. Trying fallback.")
        return await _poll_fallback(obj_id)


async def _poll_fallback(obj_id: int) -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{FALLBACK}/district/{obj_id}",
                headers={"x-api-key": FALLBACK_API_KEY}
            )
        return _parse_alert_color(resp.json() if resp.status_code == 200 else {})
    except Exception:
        return "GREEN"


def _ensure_active_policy(db: Session, user_id: int, profile: models.WorkerProfile) -> models.Policy | None:
    print(f"[TRACE _ensure_active_policy] user_id={user_id} zone={profile.zone}")

    active = crud.get_active_policy(db, user_id)
    print(f"[TRACE _ensure_active_policy] get_active_policy returned: {active}")
    if active:
        print(f"[TRACE _ensure_active_policy] USING EXISTING: id={active.id} start={active.week_start_date} end={active.week_end_date} paid={active.is_paid}")
        return active

    print(f"[TRACE _ensure_active_policy] No active policy. Checking history for user_id={user_id}")
    latest = db.query(models.Policy).filter(
        models.Policy.user_id == user_id,
        models.Policy.is_paid == True,
    ).order_by(models.Policy.week_end_date.desc()).first()
    print(f"[TRACE _ensure_active_policy] latest paid policy: {latest}")

    if not latest:
        print(f"[TRACE _ensure_active_policy] FAILED: worker {user_id} has NEVER had a paid policy")
        return None

    print(f"[TRACE _ensure_active_policy] latest paid policy: id={latest.id} start={latest.week_start_date} end={latest.week_end_date} paid={latest.is_paid}")

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    print(f"[TRACE _ensure_active_policy] Creating NEW policy: user={user_id} zone={profile.zone.value} start={week_start} end={week_end} today={today}")

    policy = crud.create_policy(
        db=db,
        user_id=user_id,
        week_start_date=week_start,
        zone=profile.zone.value,
        tier=profile.tier.value,
        weekly_coverage=profile.weekly_coverage,
        weekly_premium=profile.weekly_premium,
    )
    print(f"[TRACE _ensure_active_policy] crud.create_policy returned: id={policy.id} start={policy.week_start_date} end={policy.week_end_date} is_paid={policy.is_paid} is_active={policy.is_active}")

    crud.mark_policy_paid(db, policy.id)
    db.refresh(policy)
    print(f"[TRACE _ensure_active_policy] AFTER mark_policy_paid: id={policy.id} start={policy.week_start_date} end={policy.week_end_date} is_paid={policy.is_paid} is_active={policy.is_active}")

    verify = crud.get_active_policy(db, user_id)
    print(f"[TRACE _ensure_active_policy] VERIFY get_active_policy: {verify}")
    create_notification(
        db, user_id,
        "Policy Renewed",
        "Your policy was auto-renewed due to a weather event in your zone.",
        models.NotificationType.POLICY_RENEWED,
    )
    print(f"[TRACE _ensure_active_policy] SUCCESS: renewed policy id={policy.id} for user={user_id}")
    return policy


def open_claims_for_trigger(db: Session, district: str, zone: str, alert_color: str):
    print(f"\n{'='*60}")
    print(f"[TRACE open_claims_for_trigger] district={district} zone={zone} alert={alert_color}")
    print(f"[TRACE open_claims_for_trigger] date.today() = {date.today()}")

    existing = crud.get_trigger_today(db, district)
    if existing:
        print(f"[TRACE open_claims_for_trigger] STEP 1 DEDUP: trigger already fired for {district} today. SKIP.")
        lifecycle_log("trigger_dedup", f"Skipping {district} — already fired today", sim_day=date.today().isoformat())
        return 0
    print(f"[TRACE open_claims_for_trigger] STEP 1 DEDUP: no existing trigger. OK.")

    trigger = crud.create_imd_trigger(
        db=db,
        district=district,
        alert_color=alert_color,
        zone_triggered=zone,
    )
    print(f"[TRACE open_claims_for_trigger] STEP 2: trigger event created id={trigger.id}")

    print(f"[TRACE open_claims_for_trigger] STEP 3: querying WorkerProfile where zone == '{zone}'")
    workers_in_zone = db.query(models.WorkerProfile).filter(
        models.WorkerProfile.zone == zone
    ).all()
    print(f"[TRACE open_claims_for_trigger] STEP 3 RESULT: found {len(workers_in_zone)} worker profiles in zone {zone}")

    if not workers_in_zone:
        print(f"[TRACE open_claims_for_trigger] STEP 3 FAIL: NO WORKER PROFILES in zone {zone}. Check zone assignment.")
        lifecycle_log("trigger_no_workers", f"No worker profiles found in zone {zone}", sim_day=date.today().isoformat())
        return 0

    claims_opened = 0
    errors = 0
    skipped_policy = 0
    skipped_duplicate = 0
    skipped_create = 0

    for idx, profile in enumerate(workers_in_zone):
        print(f"\n[TRACE WORKER {idx+1}/{len(workers_in_zone)}] user_id={profile.user_id} zone={profile.zone} pincode={profile.pincode}")

        print(f"[TRACE WORKER] STEP 4: Calling _ensure_active_policy for user_id={profile.user_id}")
        policy = _ensure_active_policy(db, profile.user_id, profile)
        print(f"[TRACE WORKER] STEP 4 RESULT: policy={policy}")

        if not policy:
            has_ever = db.query(models.Policy).filter(
                models.Policy.user_id == profile.user_id
            ).count()
            print(f"[TRACE WORKER] SKIP: no_active_policy. has_ever_had_policy={has_ever}")
            record_eligibility(district, zone, alert_color, profile.user_id, False, "no_active_policy", {"has_ever_had_policy": has_ever})
            skipped_policy += 1
            continue

        print(f"[TRACE WORKER] STEP 5: policy OK: id={policy.id} start={policy.week_start_date} end={policy.week_end_date} is_paid={policy.is_paid} is_active={policy.is_active}")

        print(f"[TRACE WORKER] STEP 6: checking existing active claim for user_id={profile.user_id}")
        existing_claim = crud.get_active_claim(db, profile.user_id)
        print(f"[TRACE WORKER] STEP 6 RESULT: existing_claim={existing_claim}")

        if existing_claim:
            print(f"[TRACE WORKER] SKIP: existing_monitoring_claim id={existing_claim.id} status={existing_claim.status}")
            record_eligibility(district, zone, alert_color, profile.user_id, False, "existing_monitoring_claim", {
                "existing_claim_id": existing_claim.id,
                "existing_claim_status": existing_claim.status.value if hasattr(existing_claim.status, 'value') else str(existing_claim.status),
            })
            skipped_duplicate += 1
            continue

        print(f"[TRACE WORKER] STEP 7: creating claim: user_id={profile.user_id} policy_id={policy.id} trigger_event_id={trigger.id}")
        try:
            created = crud.create_claim(
                db=db,
                user_id=profile.user_id,
                policy_id=policy.id,
                trigger_event_id=trigger.id,
            )
            print(f"[TRACE WORKER] STEP 7 RESULT: created={created}")

            if created:
                claims_opened += 1
                print(f"[TRACE WORKER] CLAIM OPENED: claim_id={created.id} status={created.status}")
                create_notification(
                    db, profile.user_id,
                    "Claim #%d Opened" % created.id,
                    "%s %s alert triggered a claim. Your income is now being monitored." % (district, alert_color.title()),
                    models.NotificationType.CLAIM_OPENED,
                    metadata_json='{"claim_id": %d, "district": "%s", "alert": "%s"}' % (created.id, district, alert_color),
                )
                record_eligibility(district, zone, alert_color, profile.user_id, True, "opened", {
                    "claim_id": created.id,
                    "policy_id": policy.id,
                })
            else:
                print(f"[TRACE WORKER] FAIL: create_claim returned None")
                existing_check = db.query(models.Claim).filter(
                    models.Claim.user_id == profile.user_id,
                    models.Claim.status.in_([models.ClaimStatusEnum.MONITORING, models.ClaimStatusEnum.PAYOUT_READY])
                ).first()
                print(f"[TRACE WORKER] FAIL DETAIL: existing_active_check={existing_check}")
                if existing_check:
                    print(f"[TRACE WORKER] FAIL DETAIL: found claim id={existing_check.id} status={existing_check.status} monitoring_start={existing_check.monitoring_start}")
                record_eligibility(district, zone, alert_color, profile.user_id, False, "create_claim_returned_none", {
                    "existing_active": str(existing_check) if existing_check else None,
                })
                skipped_create += 1
        except Exception as e:
            print(f"[TRACE WORKER] EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            audit_error(f"open_claims:worker_{profile.user_id}", e, worker_id=profile.user_id)
            record_eligibility(district, zone, alert_color, profile.user_id, False, "exception", {"error": str(e)})
            errors += 1

    print(f"\n{'='*60}")
    print(f"[TRACE open_claims_for_trigger] SUMMARY: {claims_opened} opened, {skipped_policy} skipped(policy), {skipped_duplicate} skipped(dup), {skipped_create} skipped(create), {errors} errors, {len(workers_in_zone)} total")
    print(f"{'='*60}")

    # Send WEATHER_ALERT notification to all workers in zone
    for profile in workers_in_zone:
        create_notification(
            db, profile.user_id,
            "%s ALERT issued for your area." % alert_color.upper(),
            "An official %s alert has been declared for your zone. Stay safe and monitor updates." % alert_color.upper(),
            models.NotificationType.WEATHER_ALERT,
            metadata_json='{"district": "%s", "alert": "%s", "zone": "%s"}' % (district, alert_color, zone),
        )

    # Regenerate SmartWork tips so mid-week alerts are reflected immediately
    for profile in workers_in_zone:
        try:
            generate_weekly_tip(db, profile.user_id, send_notification=False)
        except Exception:
            pass

    lifecycle_log("trigger_fired", f"{district} {alert_color} Zone {zone} | {claims_opened} opened, {errors} errors, {len(workers_in_zone)} checked", sim_day=date.today().isoformat())
    return claims_opened


async def run_imd_poll(db: Session):
    lifecycle_log("imd_poll_start", f"Polling {len(DISTRICT_MAP)} districts")
    for entry in DISTRICT_MAP:
        try:
            alert_color = await poll_imd_district(entry["obj_id"])
            lifecycle_log("imd_district_result", f"{entry['district']} -> {alert_color}", sim_day=date.today().isoformat())

            if alert_color == "YELLOW":
                continue

            if _should_trigger(alert_color, entry["zone"]):
                open_claims_for_trigger(db, entry["district"], entry["zone"], alert_color)
        except Exception as e:
            audit_error(f"imd_poll:{entry['district']}", e)
