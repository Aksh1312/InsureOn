import time
import threading
from datetime import datetime
from typing import Any

_lock = threading.Lock()
_eligibility_events: list[dict[str, Any]] = []
_MAX_EVENTS = 5000


def record_eligibility(
    trigger_district: str,
    trigger_zone: str,
    alert_color: str,
    worker_id: int,
    eligible: bool,
    reason: str,
    details: dict[str, Any] | None = None,
):
    with _lock:
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "trigger_district": trigger_district,
            "trigger_zone": trigger_zone,
            "alert_color": alert_color,
            "worker_id": worker_id,
            "eligible": eligible,
            "reason": reason,
            "details": details or {},
        }
        _eligibility_events.append(event)
        if len(_eligibility_events) > _MAX_EVENTS:
            _eligibility_events.pop(0)


def get_eligibility_events(limit: int = 500) -> list[dict[str, Any]]:
    with _lock:
        return list(_eligibility_events[-limit:])


def get_eligibility_summary() -> dict[str, Any]:
    with _lock:
        total = len(_eligibility_events)
        eligible = sum(1 for e in _eligibility_events if e["eligible"])
        skipped = total - eligible
        reasons: dict[str, int] = {}
        for e in _eligibility_events:
            if not e["eligible"]:
                reasons[e["reason"]] = reasons.get(e["reason"], 0) + 1
        by_trigger: dict[str, dict[str, int]] = {}
        for e in _eligibility_events:
            key = e["trigger_district"]
            if key not in by_trigger:
                by_trigger[key] = {"total": 0, "eligible": 0, "skipped": 0}
            by_trigger[key]["total"] += 1
            if e["eligible"]:
                by_trigger[key]["eligible"] += 1
            else:
                by_trigger[key]["skipped"] += 1
        return {
            "total_workers_checked": total,
            "total_eligible": eligible,
            "total_skipped": skipped,
            "skip_reasons": reasons,
            "by_trigger": by_trigger,
        }


def clear_eligibility_events():
    with _lock:
        _eligibility_events.clear()
