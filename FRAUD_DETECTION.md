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
    └── Behavioral Baseline Deviation
            │
            ▼
    Logistic Regression Model
    (weights trained on labelled claim outcomes)
            │
            ▼
    Fraud Probability Score  ──►  Graph-Based Fraud Ring Detection
            │
            ▼
    Decision Engine
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
  + b
)
```

**Weights `w1–w5` and bias `b` are trained on labelled historical claims** (approved vs. fraudulent). As more claims are processed and labelled, the model retrains and improves — creating an improving feedback loop over time.

**Example current weight distribution:**

| Feature | Approximate Weight |
|---|---|
| Worker history | 0.30 |
| Event verification | 0.20 |
| Zone claim pattern | 0.20 |
| Behavioral deviation | 0.15 |
| Fraud ring signals | 0.15 |

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

The combination of **parametric triggers + behavioral analytics + geographic correlation + graph-based ring detection + a continuously improving ML model** makes this system extremely difficult to defraud at scale.

---