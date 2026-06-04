import urllib.request, urllib.parse, json

base = "http://127.0.0.1:8000"

def req(url, method="GET", data=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data:
        body = urllib.parse.urlencode(data).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.request.HTTPError as e:
        return e.code, e.read().decode()[:100]

# 1. Debug route without auth
status, body = req(f"{base}/debug/claims")
print(f"1. GET /debug/claims (no auth): {status}", end="")
print(" UNPROTECTED!" if status == 200 else " SECURE")

# 2. Login as admin
status, body = req(f"{base}/login", "POST", {"username": "admin@insureon.dev", "password": "admin123"})
if status == 200:
    admin_token = body["access_token"]
    print(f"2. Admin login: OK (token={admin_token[:20]}...)")
else:
    print(f"2. Admin login FAILED: {body}")
    exit(1)

# 3. Debug route with admin auth
status, body = req(f"{base}/debug/claims", token=admin_token)
print(f"3. GET /debug/claims (admin): {status}", end="")
if status == 200:
    print(f" OK, total_claims={body.get('total')}")
else:
    print(f" DENIED")

# 4. Login as worker
status, body = req(f"{base}/login", "POST", {"username": "worker0@sim.insureon.dev", "password": "sim-worker-0-pass"})
if status == 200:
    worker_token = body["access_token"]
    print(f"4. Worker login: OK")
else:
    print(f"4. Worker login FAILED: {body}")
    exit(1)

# 5. Debug route with worker auth (should be FORBIDDEN)
status, body = req(f"{base}/debug/claims", token=worker_token)
print(f"5. Worker GET /debug/claims: {status}", end="")
print(" UNPROTECTED!" if status == 200 else " FORBIDDEN (correct)")

# 6. SmartWork as admin (has profile? admin has pincode 000000)
status, body = req(f"{base}/workers/smartwork", token=admin_token)
print(f"6. Admin GET /workers/smartwork: {status}", end="")
if status == 200:
    print(f" OK, confidence={body.get('confidence_score')}")
else:
    print(f" {body}")

# 7. Worker dashboard
status, body = req(f"{base}/dashboard/summary", token=worker_token)
print(f"7. Worker dashboard: {status}", end="")
if status == 200:
    print(f" OK, user={body.get('user',{}).get('email')}")
else:
    print(f" {body}")

# 8. Worker smartwork
status, body = req(f"{base}/workers/smartwork", token=worker_token)
print(f"8. Worker GET /workers/smartwork: {status}", end="")
if status == 200:
    print(f" OK, has_tip=True, confidence={body.get('confidence_score')}")
else:
    print(f" {body}")

# 9. Worker notifications
status, body = req(f"{base}/notifications", token=worker_token)
print(f"9. Worker GET /notifications: {status}", end="")
if status == 200:
    print(f" OK, count={len(body)}")
else:
    print(f" {body}")

# 10. Admin routes: non-admin trying
status, body = req(f"{base}/admin/dashboard", token=worker_token)
print(f"10. Worker GET /admin/dashboard: {status}", end="")
print(" UNPROTECTED!" if status == 200 else " FORBIDDEN (correct)")

print("\n=== VALIDATION COMPLETE ===")
