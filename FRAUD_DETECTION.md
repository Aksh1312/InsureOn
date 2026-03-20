# Gig Worker Insurance — Fraud Detection System

Welcome to the detective agency of our insurance platform! Here, we make sure that only genuine claims get through, so honest gig workers are protected and the system stays fair for everyone. We use a blend of smart data, real-world signals, and a little bit of digital detective work—no magnifying glass required.

## Core Philosophy

This insurance system is **parametric**, meaning claims are triggered by **objective external events** rather than self-reported damage. This alone eliminates most traditional insurance fraud.

The fraud detection model operates through **multiple layered signals**, all feeding into a **logistic regression model** whose weights are continuously retrained as new labelled claim data accumulates. Over time, the model becomes increasingly accurate — a core data moat advantage.

Additionally, fraud ring detection is **graph-based**: workers, devices, payment accounts, and zones are modelled as nodes in a graph, and edges are drawn when connections are detected. Suspicious clusters emerge as densely connected subgraphs.

---

## System Architecture

Think of this as a series of security gates. Each layer is a checkpoint, filtering out suspicious claims so only the real ones make it through. The result? A system that’s fair, fast, and always learning.

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

First, we check if a real disaster or disruption happened, using only trusted, official sources. If there’s no real event, the claim is flagged for review—no shortcuts!

Confirms whether a disaster or disruption actually occurred using official external sources.

- India Meteorological Department (IMD)
- National Disaster Management Authority (NDMA)
- State government disaster alerts
- Weather APIs

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

We compare today’s weather to what’s normal for this time of year. If it’s not unusually bad, we get a little suspicious—no crying wolf!

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

We look at the worker’s history and patterns. Are they making claims all the time? Did they suddenly stop working? Or do they have a steady, honest record? The system rewards consistency and flags odd behavior.

Each worker receives a dynamic fraud risk score based on historical activity patterns.

**Key Signals:**

| Signal | Interpretation |
|---|---|
| High claim frequency | Elevated risk |

---

## Identifying Genuine Workers Within a Fraud Ring

When a fraud ring is detected, the system does not automatically penalize every worker in the cluster. Instead, it applies a second layer of analysis to identify and protect genuine claimants:

- **Individual Behavioral Analysis:** Each worker’s activity, income, and work patterns are compared to their historical baseline and to their peers. Genuine workers typically show gradual income drops, consistent work history, and realistic behavioral changes during disasters.
- **Device, Network, and Mobility Checks:** The system examines device integrity, network consistency, and movement realism for each worker. Honest workers display natural movement, degraded network quality during disasters, and no signs of spoofing or emulation.
- **Peer Comparison:** Outlier detection is used to spot workers whose patterns differ significantly from the rest of the cluster. Genuine workers may have unique, non-synchronized claim timings and diverse behavioral signals.
- **Manual Review for Edge Cases:** If a worker in a flagged cluster passes all individual checks, their claim is prioritized for manual review rather than automatic rejection.

**Outcome:** This layered approach ensures that honest workers are not unfairly penalized, even if they are part of a flagged fraud ring. The system’s goal is to delay for further verification, not deny, whenever there is doubt.
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

We check with the delivery platforms to see if the worker was actually active before and during the event. If someone stopped working before the disaster, that’s a red flag. We want to help those who were truly affected.

Verifies whether the worker was actively operating before and during the claimed disruption period.

**Data Integrations:** Swiggy, Zomato, Blinkit (and similar delivery platforms)

**Checks Performed:**
- Was the worker logged into the platform?
- Were deliveries completed before the event?
- Did inactivity begin exactly at claim submission time?

Workers who show inactivity that predates the disaster event may have claims flagged.

---

## Layer 5 — Income Pattern Analysis

We look for natural, gradual drops in income (which are normal in disasters) versus sudden, suspicious zeroes. If your earnings graph suddenly flatlines, it’s a red flag. But if it drops gradually, it’s likely real.

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

If lots of workers in a zone are affected, it’s probably real. If only one or two are, we look closer. We want to spot real disasters, not isolated incidents.

Workers are assigned to zones (city / pincode level). Claims are compared across workers in the same zone.

**Example:**

| Zone | Workers | Claims |
|---|---|---|
| Zone A | 100 | 40 claims |
| Zone B | 100 | 3 claims |

High simultaneous claim rates in a zone support genuine event confirmation. A lone claimant in an otherwise unaffected zone raises fraud risk.

---

## Layer 7 — Nearby Zone Cross-Validation

Disasters don’t respect borders. If only one area is affected, that’s odd. We check if neighboring zones are seeing the same thing. If not, we dig deeper.

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

Layer 8 now brings together all advanced behavioral, device, network, and mobility checks to create a robust, holistic fraud detection layer. We don’t just look at your work patterns—we also verify that your device, network, and movement all make sense for a real delivery worker.

**Behavioral Baseline & Peer Comparison:**
Every worker builds a behavioral fingerprint over time. During a claim event, we compare your current behavior to your baseline and to similar peers (same zone, same tier, similar hours). Sudden changes or outlier patterns are flagged for review.

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
  + device_integrity_score
  + network_consistency_score
  + mobility_realism_score
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

**Device Integrity Checks:**
We look for signs of GPS spoofing, mock location apps, emulators, and sensor mismatches (e.g., GPS says “moving” but accelerometer says “stationary”).

**Network Consistency Checks:**
We compare IP geolocation to GPS, look for sudden IP jumps (VPN use), check ISP consistency, and monitor network quality. Genuine disasters often degrade network quality, so a perfect connection during a claimed event is suspicious.

**Mobility Realism Checks:**
We analyze your movement patterns—real workers move continuously, follow roads, and have realistic speeds. Spoofers “teleport,” stay static, or move in impossible ways. We score your path realism and flag anomalies.

**Peer Comparison:**
Workers are compared to similar peers. Outliers—like someone with a –100% income drop when everyone else is at –70%—are flagged for review.

By combining all these signals, Layer 8 acts as a powerful, unified defense against both simple and sophisticated fraud attempts.

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
