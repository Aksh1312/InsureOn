# Gig Worker Insurance — Fraud Detection System

## Core Philosophy

This insurance system is **parametric**, meaning claims are triggered by **objective external events** rather than self-reported damage. This alone eliminates most traditional insurance fraud.

The fraud detection model operates through **multiple layered signals**, all feeding into a **logistic regression model** whose weights are continuously retrained as new labelled claim data accumulates. Over time, the model becomes increasingly accurate — a core data moat advantage.

Additionally, fraud ring detection is **graph-based**: workers, devices, payment accounts, and zones are modelled as nodes in a graph, and edges are drawn when connections are detected. Suspicious clusters emerge as densely connected subgraphs.

---

## System Architecture

```
Raw Signals
    │
    ├── Event Verification
    ├── Historical Weather Comparison
    ├── Worker Behaviour Analysis
    ├── Platform Activity Verification
    ├── Income Pattern Analysis
    ├── Zone-Based Correlation
    ├── Nearby Zone Cross-Validation
    ├── Behavioral Baseline Deviation
    ├── Device Integrity Signals
    ├── Network Consistency Signals
    └── Mobility Realism Signals
            │
            ▼
    Logistic Regression Model
    (weights trained on labelled claim outcomes)
            │
            ▼
    Fraud Probability Score  ──►  Graph-Based Fraud Ring Detection
            │
            ▼
    Decision Engine (UX-Aware: Delay, not Deny)
```

---

## Layer 1 — Event Verification

Confirms whether a disaster or disruption actually occurred using official external sources.

**Data Sources:**
- India Meteorological Department (IMD)
- National Disaster Management Authority (NDMA)
- State government disaster alerts
- Weather APIs

**Event Types Verified:** Floods, Cyclones, Heavy Rainfall, Storm Alerts, Government Curfews, Civil Unrest

**Alert Severity Mapping:**

| Alert Level | Signal Strength |
|---|---|
| Red Alert | Strong confirmation |
| Orange Alert | Moderate confirmation |
| Yellow Alert | Weak confirmation |
| No Alert | High fraud risk flag |

If no official event is detected, claims are immediately flagged for review.

---

## Layer 2 — Historical Weather Verification

Compares current conditions against historical baselines to detect abnormal intensity.

**Example Logic:**

```
If rainfall_today >= 90th_percentile(historical_rainfall_same_date):
    event_confidence += HIGH
else:
    fraud_risk += MODERATE
```

This prevents claims during normal weather conditions from passing undetected.

---

## Layer 3 — Worker Behaviour Risk Score

Each worker receives a dynamic fraud risk score based on historical activity patterns.

**Key Signals:**

| Signal | Interpretation |
|---|---|
| High claim frequency | Elevated risk |
| Recent repeated claims | Higher suspicion |
| Stable long-term working history | Lower risk |
| Sudden unexplained inactivity | Possible manipulation |
| Irregular income patterns | Potential fraud indicator |

**Score Formula (logistic regression input feature):**

```
worker_risk =
    w1 * claim_history_score
  + w2 * work_activity_pattern_score
  + w3 * income_drop_pattern_score
```

Weights `w1`, `w2`, `w3` are trained and updated continuously via logistic regression on labelled outcomes.

---

## Layer 4 — Platform Activity Verification

Verifies whether the worker was actively operating before and during the claimed disruption period.

**Data Integrations:** Swiggy, Zomato, Blinkit (and similar delivery platforms)

**Checks Performed:**
- Was the worker logged into the platform?
- Were deliveries completed before the event?
- Did inactivity begin exactly at claim submission time?

Workers who show inactivity that predates the disaster event may have claims flagged.

---

## Layer 5 — Income Pattern Analysis

The system calculates a baseline daily income from historical earnings:

```
Baseline Income = Total Earnings (last 4–8 weeks) ÷ Working Days
```

A valid claim requires income to fall below **50% of baseline** for at least **5 consecutive days**.

**Pattern Classification:**

| Pattern | Interpretation |
|---|---|
| Gradual income drop | Likely genuine disruption |
| Partial earnings retained | Consistent with real disaster |
| Instant zero income at claim start | Suspicious — possible intentional stoppage |

---

## Layer 6 — Zone-Based Risk Analysis

Workers are assigned to zones (city / pincode level). Claims are compared across workers in the same zone.

**Example:**

| Zone | Workers | Claims |
|---|---|---|
| Zone A | 100 | 40 claims |
| Zone B | 100 | 3 claims |

High simultaneous claim rates in a zone support genuine event confirmation. A lone claimant in an otherwise unaffected zone raises fraud risk.

---

## Layer 7 — Nearby Zone Cross-Validation

Genuine disasters typically affect multiple adjacent geographic areas.

**Example — Genuine Disaster Pattern:**

| Zone | Claim Rate |
|---|---|
| Zone A | 42% |
| Zone B | 39% |
| Zone C | 35% |

If neighboring zones show no claims while one zone has high claims, the cluster is flagged for review.

---

## Layer 8 — Behavioral Baseline Deviation Detection

Every worker builds a **behavioral fingerprint** over time. During a claim event, current behavior is compared to this baseline.

**Worker Behavioral Profile (Example):**

| Metric | Normal Pattern |
|---|---|
| Login time | 9 AM – 10 AM |
| Active hours/day | 6–8 hours |
| Daily income | ₹900–₹1,200 |
| Deliveries/hour | 2–3 |
| Working zones | Zone A + Zone B |

**Deviation Score Formula (logistic regression input feature):**

```
behavior_deviation =
    Δ working_hours
  + Δ login_pattern
  + Δ income_pattern
  + Δ delivery_density
  + zone_shift_indicator
```

**Detecting Intentional Work Stoppage:**

Normal week:
```
Mon: 7 hrs | Tue: 8 hrs | Wed: 6 hrs | Thu: 7 hrs
```

Claim week:
```
Mon: 7 hrs | Tue: 8 hrs | Wed: 0 hrs | Thu: 0 hrs
```

Abrupt stoppage precisely aligned with claim submission is a strong fraud signal.

**Peer Comparison:**

Workers are compared to similar peers (same zone, same tier, similar hours):

| Worker | Income Drop |
|---|---|
| Worker A | –70% |
| Worker B | –65% |
| Worker C | –68% |
| Worker D | –100% |

Worker D is an outlier and is flagged for review.

---

## Adversarial Defense — Anti-GPS Spoofing

GPS alone is easy to fake. The system does not trust declared location; it verifies **behavioral reality** across multiple hard-to-fake signals simultaneously.

### Real Worker vs. Spoofer: Signal Comparison

| Signal | Genuine Worker | GPS Spoofer |
|---|---|---|
| Movement before disruption | Active, moving | Static at home |
| Order acceptance attempts | Present | Absent |
| Network quality | Degraded / unstable | Clean connection |
| Activity drop pattern | Gradual | Instant, perfect zero |
| Nearby worker behavior | Similar struggle | Isolated pattern |
| Sensor consistency | GPS matches accelerometer | Mismatch detected |

The core principle shifts from:
```
trust(GPS)
```
to:
```
trust(behavior + network + platform_activity + mobility_pattern + device_integrity)
```

---

### Layer 9 — Device Integrity Signals

Spoofing apps and fake environments leave detectable traces at the device level.

**Checks Performed:**
- Mock location / developer mode detection (Android)
- Emulator environment detection
- App integrity validation
- Sensor mismatch: GPS vs. accelerometer disagreement

**Example:**
```
If GPS reports "moving through flood zone"
   AND accelerometer reports "stationary":
       → flag: sensor_mismatch = TRUE  🚨
```

---

### Layer 10 — Network Consistency Signals

GPS coordinates can be spoofed, but network-level signals are significantly harder to fake.

**Checks Performed:**
- IP geolocation vs. GPS location mismatch
- Sudden IP address jumps (VPN switching)
- ISP consistency across session
- Cell tower triangulation (where available)
- Network quality during claimed disaster period

**Example:**

| Signal | Value | Verdict |
|---|---|---|
| GPS location | Chennai flood zone | — |
| IP geolocation | Home WiFi, safe area | 🚨 Mismatch |

**During genuine disasters**, network quality degrades: high packet loss, frequent disconnects, app timeouts. A claimant with a **perfect, stable internet connection** during a claimed flood event is a strong fraud signal.

---

### Layer 11 — Mobility Realism Signals

Real delivery workers follow predictable, road-constrained movement patterns. Spoofers typically reveal themselves through unnatural movement.

**Real Worker Characteristics:**
- Continuous movement with natural stop/start patterns
- Routes follow actual road networks
- Consistent speed ranges for vehicle type

**Spoofer Characteristics:**
- Teleportation between locations
- Static position with declared GPS movement
- Unnatural path geometry (cuts through buildings, water, etc.)

**Checks Performed:**
- Speed anomaly detection (impossibly fast movement)
- Path realism scoring against road network
- Movement continuity analysis

---

### Peer Consistency Cross-Check

Comparing workers in the same zone during the same event exposes coordinated fraud rings:

| Signal | Genuine Disaster | Fraud Ring |
|---|---|---|
| Movement patterns | Chaotic, diverse | Suspiciously similar |
| Network quality | Degraded | Stable |
| Behavior profiles | Varied | Near-identical |

---

### Telegram / Coordination Detection

Fraud rings coordinating on messaging platforms (e.g., Telegram) leave detectable patterns in the claims data:

- Synchronized claim submission timing (within minutes)
- Identical behavioral profiles across unrelated workers
- Matching spoofing artifacts (same mock location app signatures)
- Identical income drop curves

These patterns create strong edges in the fraud ring graph and elevate cluster risk scores significantly.

---

## UX Balance — Protecting Honest Workers

Fraud detection must never punish legitimate claimants. The system is designed around the principle: **delay, not deny**.

### Claim Handling Flow

**🟢 Low Risk — Instant auto-payout**
No friction. Claim approved automatically.

**🟡 Medium Risk — Light passive verification**
- Silent background data check (no worker action required)
- Optional soft prompt: *"Were you trying to go online during the disruption?"*
- No blocking; claim held briefly while checks run

**🔴 High Risk — Delayed payout with deeper checks**
- Payout delayed, not denied
- App activity logs reviewed
- Session integrity validated
- Worker informed transparently

### Worker-Facing Communication

Claims under review receive a clear, non-alarming message:

> *"Your claim is being processed due to network inconsistencies. No action needed. Expected resolution: 24–48 hours."*

This avoids frustration, maintains trust, and does not signal to fraudsters exactly what triggered the review.

### Key UX Principles

- Never block instantly unless confidence is very high
- Verify silently wherever possible
- Always keep the worker informed
- Prefer delayed payout over outright denial for ambiguous cases

---

## Final Fraud Probability Score (Logistic Regression)

All feature signals feed into a logistic regression model that outputs a fraud probability between 0 and 1.

**Model Structure:**

```
P(fraud) = sigmoid(
    w1 * worker_history_score
  + w2 * event_verification_score
  + w3 * zone_claim_pattern_score
  + w4 * nearby_zone_behavior_score
  + w5 * behavioral_deviation_score
  + w6 * device_integrity_score
  + w7 * network_consistency_score
  + w8 * mobility_realism_score
  + b
)
```

**Weights `w1–w8` and bias `b` are trained on labelled historical claims** (approved vs. fraudulent). As more claims are processed and labelled, the model retrains and improves — creating an improving feedback loop over time.

**Example current weight distribution:**

| Feature | Approximate Weight |
|---|---|
| Worker history | 0.20 |
| Event verification | 0.15 |
| Zone claim pattern | 0.15 |
| Behavioral deviation | 0.15 |
| Fraud ring signals | 0.15 |
| Device integrity | 0.10 |
| Network consistency | 0.10 |
| Mobility realism | 0.05 |

**Decision Thresholds:**

| P(fraud) | Action |
|---|---|
| 0–20% | Auto-approve |
| 20–50% | Fast automated review |
| 50–80% | Manual review |
| 80%+ | Reject / investigate |

Expected outcome: **80–90% of valid claims auto-approved**, keeping operational costs low.

---

## Graph-Based Fraud Ring Detection

Fraud rings are detected using a **graph model** where:

- **Nodes** = Workers, Devices, Payment Accounts, Zones
- **Edges** = Shared identifiers (same device ID, UPI handle, phone number, bank account, zone, claim timing)

Fraud rings appear as **densely connected subgraphs** — clusters of nodes with many shared edges.

### Edge Types (Connection Signals)

| Shared Attribute | Edge Weight |
|---|---|
| Same UPI / bank account | High |
| Same device ID | High |
| Same phone number | High |
| Same zone + simultaneous claim | Medium |
| Similar income drop pattern | Low–Medium |

### Claim Timing Pattern Detection

Genuine disaster claims arrive spread over multiple days. Fraud rings often submit within minutes:

| Worker | Claim Time |
|---|---|
| A | 10:02 AM |
| B | 10:04 AM |
| C | 10:06 AM |

This timing clustering is a strong graph edge signal between these nodes.

### Micro-Location Clustering

| Area | Workers | Claims |
|---|---|---|
| Single small street | 8 | 7 claims |

Real disasters affect wider geographic areas. Hyper-local concentration in a small cluster is suspicious.

### Cluster Risk Score Formula

```
cluster_risk =
    0.4 * claim_time_similarity
  + 0.3 * location_overlap
  + 0.2 * income_pattern_similarity
  + 0.1 * device_or_payment_link
```

High-scoring clusters are escalated for investigation regardless of individual P(fraud) scores.

---

## Automated Claim Processing Summary

| Claim Category | Volume (Expected) | Handling |
|---|---|---|
| Low risk (P < 0.20) | ~80–90% | Automatic approval |
| Medium risk (0.20–0.50) | ~5–10% | Fast automated review |
| High risk (0.50–0.80) | ~3–5% | Manual investigation |
| Fraud ring flagged | <2% | Reject / deep investigation |

---

## Why This System Is Strong

| Capability | Advantage |
|---|---|
| Parametric event verification | Eliminates most traditional fraud upfront |
| Logistic regression with retraining | Model improves with every labelled claim |
| Behavioral baseline deviation | Detects intentional work stoppage |
| Graph-based fraud ring detection | Catches coordinated organized fraud |
| Zone + neighboring zone correlation | Geographic cross-validation of claims |
| Peer comparison | Flags statistical outliers within cohorts |
| Device integrity checks | Detects mock location apps and emulators |
| Network consistency analysis | Catches IP/GPS mismatches and VPN use |
| Mobility realism scoring | Identifies teleportation and unnatural paths |
| UX-aware decision engine | Protects honest workers via delay-not-deny |

The combination of **parametric triggers + behavioral analytics + geographic correlation + graph-based ring detection + adversarial anti-spoofing layers + a continuously improving ML model** makes this system extremely difficult to defraud at scale, while keeping the experience fair and frictionless for honest workers.

---

*Document version: 2.0 — Gig Worker Insurance Platform*
