"""
e2e_verify.py — End-to-end smoke test for the InsureOn API.

Verifies 12 core endpoints are accessible, authenticated, and returning
valid responses.  Exit code 0 only if all checks pass.

Usage:
    python e2e_verify.py

Requires the backend to be running on http://127.0.0.1:8000.
"""

import urllib.request, urllib.parse, json, sys, os

BASE = "http://127.0.0.1:8000"
PASS = 0
FAIL = 0

ADMIN_EMAIL = "admin@insureon.dev"
ADMIN_PASS = "admin123"
WORKER_EMAIL = "worker10@sim.insureon.dev"
WORKER_PASS = "sim-worker-10-pass"


def req(method, path, data=None, headers=None, as_json=False):
    h = headers or {}
    body = None
    if data is not None:
        if as_json:
            body = json.dumps(data).encode()
            h.setdefault("Content-Type", "application/json")
        else:
            body = urllib.parse.urlencode(data).encode()
            h.setdefault("Content-Type", "application/x-www-form-urlencoded")
    r = urllib.request.Request(f"{BASE}{path}", data=body, method=method, headers=h)
    try:
        resp = urllib.request.urlopen(r)
        ctype = resp.headers.get("Content-Type", "")
        if "application/json" in ctype:
            return resp.status, json.loads(resp.read().decode())
        return resp.status, resp.read().decode()[:200]
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except Exception:
            err = {"detail": str(e)}
        return e.code, err
    except urllib.error.URLError as e:
        return 0, {"detail": f"URLError: {e.reason}"}


def check(n, label, endpoint, ok, detail=""):
    global PASS, FAIL
    status = "PASS" if ok else "FAIL"
    if ok:
        PASS += 1
    else:
        FAIL += 1
    print(f"  [{status}] [{n:02d}] {label}")
    print(f"          Endpoint: {endpoint}")
    if detail:
        print(f"          Detail:   {detail}")


# ── 1. Admin Login ─────────────────────────────────────────────
print("\n[01] Admin Login")
s, b = req("POST", "/login", {"username": ADMIN_EMAIL, "password": ADMIN_PASS})
admin_token = b.get("access_token", "")
check(1, "Admin login succeeds", "POST /login",
      s == 200 and bool(admin_token),
      f"status={s}, token={bool(admin_token)}")

admin_headers = {"Authorization": f"Bearer {admin_token}"}

# ── 2. Worker Login ────────────────────────────────────────────
print("\n[02] Worker Login")
s, b = req("POST", "/login", {"username": WORKER_EMAIL, "password": WORKER_PASS})
worker_token = b.get("access_token", "")
check(2, "Worker login succeeds", "POST /login",
      s == 200 and bool(worker_token),
      f"status={s}, token={bool(worker_token)}")

worker_headers = {"Authorization": f"Bearer {worker_token}"}

# If either token is missing, abort early
if not admin_token or not worker_token:
    print("\nFATAL: Authentication failed — cannot proceed with remaining checks.")
    sys.exit(1)

# ── 3. Worker Dashboard ────────────────────────────────────────
print("\n[03] Worker Dashboard")
s, b = req("GET", "/dashboard/summary", headers=worker_headers)
has_sw = isinstance(b, dict) and b.get("smartwork_tip") is not None
check(3, "Dashboard loads with smartwork tip", "GET /dashboard/summary",
      s == 200 and has_sw,
      f"status={s}, smartwork_tip={'yes' if has_sw else 'no'}")

# ── 4. SmartWork Tip ───────────────────────────────────────────
print("\n[04] SmartWork Tip")
s, b = req("GET", "/workers/smartwork", headers=worker_headers)
has_tip = isinstance(b, dict) and b.get("id") is not None
has_risk = isinstance(b, dict) and b.get("risk_advisory") is not None
check(4, "SmartWork tip retrieved", "GET /workers/smartwork",
      s == 200 and has_tip,
      f"status={s}, tip_id={b.get('id')}, risk_advisory={'yes' if has_risk else 'no'}")

# ── 5. Worker Claims ───────────────────────────────────────────
print("\n[05] Worker Claims")
s, b = req("GET", "/claims/history", headers=worker_headers)
claims = b if isinstance(b, list) else []
check(5, "Claims history retrieved", "GET /claims/history",
      s == 200 and len(claims) > 0,
      f"status={s}, claim_count={len(claims)}")

# ── 6. Worker Wallet ───────────────────────────────────────────
print("\n[06] Worker Wallet")
s, b = req("GET", "/wallet/transactions", headers=worker_headers)
txns = b if isinstance(b, list) else (b.get("transactions", b.get("data", [])) if isinstance(b, dict) else [])
check(6, "Wallet transactions retrieved", "GET /wallet/transactions",
      s == 200,
      f"status={s}, txn_count={len(txns)}")

# ── 7. Worker Policy ───────────────────────────────────────────
print("\n[07] Worker Policy")
s, b = req("GET", "/policies/active", headers=worker_headers)
has_policy = isinstance(b, dict) and b.get("id") is not None
check(7, "Active policy retrieved", "GET /policies/active",
      s == 200 and has_policy,
      f"status={s}, policy_id={b.get('id')}")

# ── 8. Worker Notifications ────────────────────────────────────
print("\n[08] Worker Notifications")
s, b = req("GET", "/notifications", headers=worker_headers)
notifs = b.get("notifications", b.get("data", [])) if isinstance(b, dict) else (b if isinstance(b, list) else [])
check(8, "Notifications retrieved", "GET /notifications",
      s == 200 and len(notifs) > 0,
      f"status={s}, notif_count={len(notifs)}")

# ── 9. IMD Weather Triggers ────────────────────────────────────
print("\n[09] Weather Alerts (IMD Triggers)")
s, b = req("GET", "/admin/imd-triggers", headers=admin_headers)
triggers = b if isinstance(b, list) else []
check(9, "Weather alerts / IMD triggers retrieved", "GET /admin/imd-triggers",
      s == 200 and len(triggers) > 0,
      f"status={s}, trigger_count={len(triggers)}")

# ── 10. Admin Dashboard ────────────────────────────────────────
print("\n[10] Admin Dashboard")
s, b = req("GET", "/admin/dashboard", headers=admin_headers)
has_stats = isinstance(b, dict) and b.get("total_workers") is not None
check(10, "Admin dashboard loaded", "GET /admin/dashboard",
      s == 200 and has_stats,
      f"status={s}, total_workers={b.get('total_workers')}")

# ── 11. Admin Users List ───────────────────────────────────────
print("\n[11] Admin Users List")
s, b = req("GET", "/admin/workers", headers=admin_headers)
users = b if isinstance(b, list) else []
check(11, "Workers list retrieved", "GET /admin/workers",
      s == 200 and len(users) > 0,
      f"status={s}, user_count={len(users)}")

# ── 12. Admin Claims List ──────────────────────────────────────
print("\n[12] Admin Claims List")
s, b = req("GET", "/admin/claims", headers=admin_headers)
admin_claims = b if isinstance(b, list) else []
check(12, "Admin claims list retrieved", "GET /admin/claims",
      s == 200 and len(admin_claims) > 0,
      f"status={s}, claim_count={len(admin_claims)}")

# ── Summary ────────────────────────────────────────────────────
total = PASS + FAIL
print(f"\n{'=' * 55}")
print(f"  RESULTS: {PASS} / {total} checks passed")
print(f"{'=' * 55}")
sys.exit(0 if FAIL == 0 else 1)
