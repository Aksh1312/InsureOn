import argparse
import os
from typing import Any
from dotenv import load_dotenv
import httpx
load_dotenv()

SIM_URL = "http://localhost:8001"
INSUREON_BACKEND_URL = os.getenv("INSUREON_BACKEND_URL")
TIMEOUT = 20.0
ONBOARD_LIMIT = None
DAYS = 30

def _request(client: httpx.Client, method: str, path: str, **kwargs) -> dict[str, Any]:
	resp = client.request(method, path, **kwargs)
	if resp.status_code >= 400:
		try:
			detail = resp.json()
		except Exception:
			detail = resp.text
		raise RuntimeError(f"{method} {path} failed ({resp.status_code}): {detail}")
	return resp.json()


with httpx.Client(base_url=SIM_URL.rstrip("/"), timeout=TIMEOUT) as client:
    status = _request(client, "GET", "/backend/status")
    if not status.get("configured", False):
        raise RuntimeError(
            "Simulation backend bridge not configured: "
            f"{status.get('reason', 'unknown reason')}"
        )

    # Ensure a clean simulation world before test run.
    _request(client, "POST", "/reset")
    _request(client, "POST", "/init")

    onboard_payload = {"limit": ONBOARD_LIMIT} if ONBOARD_LIMIT is not None else {}
    onboard = _request(client, "POST", "/backend/onboard", params=onboard_payload)

    print("=== InsureOn Simulation Run ===")
    print(f"Simulation URL: {SIM_URL}")
    print(
        "Onboarded workers: "
        f"{onboard['onboarded']}/{onboard['requested']} "
        f"(failed: {onboard['failed']})"
    )
    print("")
    print(
        "Day | SimClaims | Legit | Fraud | "
        "BackendTriggers | BackendOpened | BackendProcessed | BackendActive"
    )
    print("-" * 103)

    totals = {
        "sim_claims": 0,
        "legit": 0,
        "fraud": 0,
        "backend_triggers": 0,
        "backend_opened": 0,
        "backend_processed": 0,
        "backend_active": 0,
    }

    for _ in range(DAYS):
        result = _request(client, "POST", "/backend/test_day")
        print(
            f"{result['day']:>3} | "
            f"{result['total_sim_claims']:>9} | "
            f"{result['legitimate_sim_claims']:>5} | "
            f"{result['fraudulent_sim_claims']:>5} | "
            f"{result['backend_trigger_count']:>15} | "
            f"{result['backend_claims_opened']:>13} | "
            f"{result.get('backend_monitor_processed', 0):>16} | "
            f"{result['backend_active_claims']:>13}"
        )

        totals["sim_claims"] += result["total_sim_claims"]
        totals["legit"] += result["legitimate_sim_claims"]
        totals["fraud"] += result["fraudulent_sim_claims"]
        totals["backend_triggers"] += result["backend_trigger_count"]
        totals["backend_opened"] += result["backend_claims_opened"]
        totals["backend_processed"] += result.get("backend_monitor_processed", 0)
        totals["backend_active"] = result["backend_active_claims"]

    print("-" * 103)
    print(f"Total sim claims: {totals['sim_claims']}")
    print(f"Total legitimate: {totals['legit']}")
    print(f"Total fraudulent: {totals['fraud']}")
    print(f"Total backend triggers: {totals['backend_triggers']}")
    print(f"Total backend opened: {totals['backend_opened']}")
    print(f"Total backend processed: {totals['backend_processed']}")
    print(f"Total backend active: {totals['backend_active']}")

    audit = _request(client, "GET", "/backend/fraud_audit")
    print("")
    print("=== Backend Fraud Audit ===")
    print(f"Claims checked: {audit['total_claims']}")
    print(f"Fraud evaluations run: {audit['evaluations_run']}")
    print(f"Flagged as fraud/suspicious: {audit['flagged_claims']}")
    print(f"Moved to manual review: {audit['manual_review_claims']}")
    print(f"Rejected claims: {audit['rejected_claims']}")
    print(f"Flagged and rejected: {audit['flagged_and_rejected']}")
    print(f"Flagged rejection rate: {audit['flagged_rejection_rate']}%")

    accuracy = _request(client, "GET", "/backend/fraud_accuracy")
    print("")
    print("=== Backend Fraud Accuracy (Worker-Level) ===")
    print(f"Workers checked: {accuracy['workers_checked']}")
    print(f"Sim fraud workers: {accuracy['sim_fraud_workers']}")
    print(f"Sim legit workers: {accuracy['sim_legit_workers']}")
    print(f"Backend flagged workers: {accuracy['backend_flagged_workers']}")
    print(f"True positives: {accuracy['true_positive']}")
    print(f"False positives: {accuracy['false_positive']}")
    print(f"False negatives: {accuracy['false_negative']}")
    print(f"True negatives: {accuracy['true_negative']}")
    print(f"Precision: {accuracy['precision']}")
    print(f"Recall: {accuracy['recall']}")