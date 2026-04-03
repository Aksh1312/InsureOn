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
from datetime import date
from sqlalchemy.orm import Session
from .. import models
from .. import crud

# IMD district obj_id mapping
# Add more cities as you onboard them
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
FALLBACK  = "https://weather.indianapi.in"  # commercial fallback


def _parse_alert_color(api_response: dict) -> str:
    """Extract color field from IMD API response."""
    try:
        color_code = api_response.get("color", 4)
        return {1: "RED", 2: "ORANGE", 3: "YELLOW", 4: "GREEN"}.get(int(color_code), "GREEN")
    except Exception:
        return "GREEN"


def _should_trigger(alert_color: str, zone: str) -> bool:
    """
    RED    → trigger all zones
    ORANGE → trigger Zone A only
    YELLOW → no trigger
    GREEN  → no trigger
    """
    if alert_color == "RED":
        return True
    if alert_color == "ORANGE" and zone == "A":
        return True
    return False


async def poll_imd_district(obj_id: int) -> str:
    """
    Call both IMD Warnings and Nowcast APIs.
    Returns the more severe color between the two.
    """
    warnings_url = f"{IMD_BASE}/warnings_district_api.php?id={obj_id}"
    nowcast_url  = f"{IMD_BASE}/nowcast_district_api.php?id={obj_id}"

    severity_order = {"RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            w_resp = await client.get(warnings_url)
            n_resp = await client.get(nowcast_url)

        w_color = _parse_alert_color(w_resp.json() if w_resp.status_code == 200 else {})
        n_color = _parse_alert_color(n_resp.json() if n_resp.status_code == 200 else {})

        # Return the more severe of the two
        return w_color if severity_order[w_color] <= severity_order[n_color] else n_color

    except Exception as e:
        print(f"IMD API error for obj_id={obj_id}: {e}. Trying fallback.")
        return await _poll_fallback(obj_id)


async def _poll_fallback(obj_id: int) -> str:
    """
    Commercial fallback API — weather.indianapi.in
    Replace with actual endpoint and API key from .env
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{FALLBACK}/district/{obj_id}",
                headers={"x-api-key": "YOUR_FALLBACK_API_KEY"}
            )
        return _parse_alert_color(resp.json() if resp.status_code == 200 else {})
    except Exception:
        return "GREEN"  # safe default if both APIs fail


def open_claims_for_trigger(db: Session, district: str, zone: str, alert_color: str):
    """
    After a trigger fires:
    1. Check deduplication (one trigger per district per day)
    2. Create IMDTriggerEvent record
    3. Find all eligible workers in that zone
    4. Open a claim for each worker with an active paid policy
    """
    # Deduplication check
    existing = crud.get_trigger_today(db, district)
    if existing:
        print(f"Trigger already fired for {district} today. Skipping.")
        return

    # Create trigger event
    trigger = crud.create_imd_trigger(
        db=db,
        district=district,
        alert_color=alert_color,
        zone_triggered=zone,
    )

    # Find all workers in this zone
    workers_in_zone = db.query(models.WorkerProfile).filter(
        models.WorkerProfile.zone == zone
    ).all()

    claims_opened = 0
    for profile in workers_in_zone:
        active_policy = crud.get_active_policy(db, profile.user_id)
        if not active_policy:
            continue  # no active paid policy — skip

        existing_claim = crud.get_active_claim(db, profile.user_id)
        if existing_claim:
            continue  # claim already open for this worker

        crud.create_claim(
            db=db,
            user_id=profile.user_id,
            policy_id=active_policy.id,
            trigger_event_id=trigger.id,
        )
        claims_opened += 1

    print(f"Trigger fired: {district} | {alert_color} | Zone {zone} | {claims_opened} claims opened")
    return claims_opened


async def run_imd_poll(db: Session):
    """
    Main poller — call this every 15 minutes via APScheduler.
    Iterates all registered districts, checks alert level,
    fires trigger if threshold met.
    """
    print(f"Running IMD poll for {len(DISTRICT_MAP)} districts...")
    for entry in DISTRICT_MAP:
        alert_color = await poll_imd_district(entry["obj_id"])

        print(f"{entry['district']} (Zone {entry['zone']}) → {alert_color}")

        if alert_color == "YELLOW":
            print(f"  Yellow alert logged for {entry['district']} — no trigger")
            continue

        if _should_trigger(alert_color, entry["zone"]):
            open_claims_for_trigger(db, entry["district"], entry["zone"], alert_color)
