# InsureOn — Income Protection Insurance for Delivery Gig Workers

A parametric income loss insurance platform designed for delivery gig workers, providing coverage against natural disasters, extreme weather, and other disruptions — with smart work optimization and automated fraud detection built in.

---

## What We Cover

Income loss for delivery gig workers due to:
- Natural disasters (floods, cyclones, earthquakes)
- Extreme weather (heavy rain, storms preventing delivery)
- Civil unrest / curfews
- Platform outages *(optional)*
- Accidents / injuries *(optional add-on)*

---

## Zone Classification

| Zone | Risk Level | Example Cities |
|---|---|---|
| 🔴 Zone A | High Risk | Chennai, Mumbai, Kolkata |
| 🟡 Zone B | Moderate Risk | Bengaluru, Hyderabad, Ahmedabad |
| 🟢 Zone C | Low Risk | Delhi, Pune, Jaipur |

Zone data is sourced from **IMD (India Meteorological Department)** and **NDMA** historical disruption records.

---

# MODULE 1 — Risk Assessment & Pricing

## 👥 Worker Personas

### 🔵 Persona 1 — Part-time Worker "Ravi"
- Works **10–25 hrs/week**, earns ~**₹4,000/week**
- Willing to spend **₹100/week** on insurance
- Treats delivery as supplementary income

### 🔴 Persona 2 — Full-time Worker "Karthik"
- Works **40+ hrs/week**, earns ~**₹11,000/week** (≈ ₹44,000/month)
- Treats delivery as primary income
- Key concern: complete income wipeout during extended disasters

---

## Tier Structure

Workers are dynamically assigned to tiers based on their **4-week average weekly working hours**:

| Tier | Weekly Working Hours | Worker Type |
|---|---|---|
| Tier 1 | 10–25 hrs/week | Part-time / Occasional |
| Tier 2 | 26–40 hrs/week | Regular Worker |
| Tier 3 | 41+ hrs/week | Full-time / Power Worker |

---

## Pricing Structure

> Coverage = **70% of average weekly income** | Premium = **~2.5% of coverage** (Zone A base)
> Maximum weekly income in Tier 3 capped at **₹12,000/week (₹48,000/month)**

### Premium Rate by Zone

| Zone | Premium as % of Coverage |
|---|---|
| Zone A (High Risk) | 2.5% |
| Zone B (Moderate Risk) | 1.7% |
| Zone C (Low Risk) | 1.2% |

### 🔵 Tier 1 — Part-time (10–25 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 10–15 hrs | ₹1,500–₹2,500 | ₹1,750 | ₹44/week | ₹30/week | ₹21/week |
| 16–20 hrs | ₹2,501–₹3,500 | ₹2,450 | ₹61/week | ₹42/week | ₹29/week |
| 21–25 hrs | ₹3,501–₹4,500 | ₹2,800 | **₹100/week** | ₹68/week | ₹48/week |

> Ravi (₹4,000/week, Zone A) → **₹100/week** — matches willingness to pay exactly.

### 🟡 Tier 2 — Regular (26–40 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 26–30 hrs | ₹4,501–₹6,500 | ₹3,850 | ₹137/week | ₹93/week | ₹66/week |
| 31–35 hrs | ₹6,501–₹8,500 | ₹5,250 | ₹175/week | ₹119/week | ₹84/week |
| 36–40 hrs | ₹8,501–₹10,500 | ₹6,650 | ₹210/week | ₹143/week | ₹101/week |

### 🔴 Tier 3 — Full-time (41+ hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 41–50 hrs | ₹10,501–₹11,000 | ₹7,500 | ₹190/week | ₹130/week | ₹90/week |
| 51–60 hrs | ₹11,001–₹11,500 | ₹7,850 | ₹195/week | ₹135/week | ₹95/week |
| 61–70 hrs | ₹11,501–₹12,000 | ₹8,200 | ₹205/week | ₹140/week | ₹100/week |
| 71+ hrs | ₹12,000+ | ₹8,400 | ₹210/week | ₹145/week | ₹100/week |

> Karthik (₹11,000/week, Zone A) → **₹190/week** — proportional and sustainable.

---

## Premium Loading & Discounts

| Condition | Adjustment |
|---|---|
| No claims in past 6 months | –10% discount |
| Multi-platform worker | –5% discount |
| Coastal / flood-prone pincode | +20–30% loading |
| Shorter waiting period (12hr vs 48hr) | +15% loading |
| Annual payment upfront | –8% discount |
| Risk score "Low" category | –15% discount |
| Risk score "Very High" category | +40% loading |

---

## Predictive Risk Modeling

Each worker receives a **personal risk score** calculated weekly, adjusting their premium multiplier on top of the base tier rate.

### Risk Factor Scoring

| Factor | Low (1) | Medium (2) | High (3) | Weight |
|---|---|---|---|---|
| Zone | Zone C | Zone B | Zone A | 30% |
| Pincode disaster frequency | <2 days/yr | 2–5 days/yr | 5+ days/yr | 25% |
| Weekly working hours | <20 hrs | 20–40 hrs | 40+ hrs | 20% |
| Work time of day | Afternoon | Morning | Night / Rain hours | 15% |
| Past claim history | 0 claims | 1 claim | 2+ claims | 10% |

### Risk Score Formula

```
Risk Score = (Zone × 0.30) + (Pincode Freq × 0.25) + (Work Hours × 0.20)
           + (Work Time × 0.15) + (Claim History × 0.10)
```

### Risk Category & Premium Multiplier

| Risk Score | Category | Multiplier |
|---|---|---|
| 1.0 – 1.5 | 🟢 Low Risk | 0.85× |
| 1.6 – 2.0 | 🟡 Medium Risk | 1.00× |
| 2.1 – 2.5 | 🟠 High Risk | 1.20× |
| 2.6 – 3.0 | 🔴 Very High Risk | 1.40× |

### Persona Examples

**Ravi** → Risk Score **2.10 → 🟠 High Risk** → ₹100 × 1.20 = **₹120/week**

**Karthik** → Risk Score **2.90 → 🔴 Very High Risk** → ₹190 × 1.40 = **₹266/week**

### ML Upgrade Path

| Stage | Approach |
|---|---|
| Launch (0–6 months) | Rule-based weighted scoring |
| Growth (6–12 months) | Logistic Regression / Decision Tree |
| Scale (12+ months) | XGBoost / Random Forest, pincode-level |

---

## Dynamic Weekly Reassignment

```
Every Monday:
→ Pull worker's last 4-week average hours and earnings from platform API
→ Pull latest IMD / NDMA risk data for their pincode
→ Recalculate personal Risk Score
→ Assign Tier + Hour Band
→ Apply Zone rate + Risk Score multiplier
→ Apply any loadings or discounts
→ Charge final weekly premium
→ Issue digital policy for that week
→ Send worker their SmartWork tips for the week
```

### Tier Transition Rules

| Situation | Rule |
|---|---|
| Worker moves UP a tier | New higher coverage applies next week |
| Worker moves DOWN a tier | Coverage steps down with 1-week buffer |
| Worker goes inactive | Coverage pauses after 2 weeks of zero activity |
| Worker resumes activity | Coverage resumes from next Monday |

---

## Claim Eligibility

A claim is valid when **all three** conditions are met:

1. Official **IMD Red/Orange alert** declared in the worker's zone
2. Daily income falls **below 50% of baseline** for **5 consecutive days**
3. Worker was **actively working** before the event

### Payout Structure

| Days of Confirmed Loss | Payout |
|---|---|
| 1–4 days | No payout |
| 5 days | 70% of weekly coverage |
| 6 days | 85% of weekly coverage |
| 7 days | 100% of weekly coverage |

**Payout timeline:** Within 48–72 hours of trigger.

---

## SmartWork — Work Optimization Feature

InsureOn doesn't just protect workers — it **actively helps them earn more** every week.

### What SmartWork Does

- **Best time slots** to work for maximum orders
- **High-earning zone** recommendations in their city
- **Weather windows** — safe periods before/after rain
- **Surge alerts** — festivals, weekends, events with high demand
- **Risk advisories** — when NOT to work for safety

### SmartWork for Part-time Workers (Tier 1)

```
SmartWork Tips — This Week

Best Time Slots:
   → Weekday evenings 7–9 PM   (dinner rush, highest order density)
   → Saturday 12–2 PM          (lunch peak, strong surge)
   → Sunday 7–10 PM            (highest surge of the week)

High-Earning Zones:
   → Areas with high restaurant density (short distances, more orders/hr)
   → Residential zones near commercial hubs (high drop-off demand)

Weather Window:
   → Avoid working during active rain (low orders, high personal risk)
   → Clear weather days = best earning opportunity

Target:
   → Concentrate hours in recommended slots
   → Projected earnings: 10–15% above usual weekly average

Risk Advisory:
   → IMD alerts active in your zone — avoid working during alert hours
```

### SmartWork for Full-time Workers (Tier 3)

```
SmartWork Tips — This Week

Optimal Shift Structure:
   → Split shifts: Late morning + Evening
   → Avoid mid-afternoon (low order density, high fuel cost per order)
   → Weekend nights = highest earning potential

Zone Rotation Strategy:
   → Weekdays   → Office and commercial zones (lunch + corporate orders)
   → Evenings   → Residential and dining areas (dinner rush)
   → Weekends   → High-footfall zones (shopping, entertainment)

Weather Strategy:
   → Light rain = surge pricing opportunity (worth staying out)
   → Heavy rain / storm = stop immediately, safety first

Earnings Optimization:
   → You don't need more hours — just shift when you work
   → Zone rotation can add ₹1,000–₹2,000/week without extra hours

Risk Advisory:
   → Active weather watch this week — keep insurance active
```

### SmartWork Data Sources

| Source | Used For |
|---|---|
| Platform order history (Swiggy / Zomato / Dunzo) | Peak hours and zone identification |
| IMD weather forecast API | Rain and storm windows |
| City event calendar | Festivals, matches, local surges |
| Worker's own past earnings | Personalized slot recommendations |
| NDMA alerts | Risk advisories and safety warnings |

### SmartWork Delivery Channels

| Channel | When |
|---|---|
| Push notification | Every Monday morning — weekly tips |
| In-app dashboard | Live surge zone map, updated daily |
| SMS alert | Urgent risk advisories (IMD red/orange alerts) |
| Weekly earnings report | Actual vs SmartWork projected earnings |

### SmartWork Impact on Risk Score & Premium

| Worker Behavior | Risk Score Impact |
|---|---|
| Follows weather avoidance tips | –0.2 risk score |
| Avoids working during IMD alerts | –0.3 risk score |
| Consistently works recommended safe slots | **"Safe Worker" –5% premium discount** |

---

# MODULE 2 — Fraud Detection System

## Core Philosophy

This system is **parametric** — claims are triggered by objective external events, not self-reported damage. This alone eliminates most traditional fraud. The remaining risk is handled through **8 layered detection signals** feeding into a continuously retrained logistic regression model, with **graph-based fraud ring detection** running in parallel.

## System Architecture

```
Raw Signals
    │
    ├── Layer 1 — Event Verification
    ├── Layer 2 — Historical Weather Comparison
    ├── Layer 3 — Worker Behaviour Risk Score
    ├── Layer 4 — Platform Activity Verification
    ├── Layer 5 — Income Pattern Analysis
    ├── Layer 6 — Zone-Based Correlation
    ├── Layer 7 — Nearby Zone Cross-Validation
    └── Layer 8 — Behavioral Baseline Deviation
            │
            ▼
    Logistic Regression Model
    (retrained continuously on labelled claims)
            │
            ▼
    Fraud Probability Score ──► Graph-Based Fraud Ring Detection
            │
            ▼
    Decision Engine
```

---

## The 8 Detection Layers

### Layer 1 — Event Verification

Confirms whether a disaster actually occurred using official sources (IMD, NDMA, state alerts).

| Alert Level | Signal Strength |
|---|---|
| Red Alert | Strong confirmation |
| Orange Alert | Moderate confirmation |
| Yellow Alert | Weak confirmation |
| No Alert | High fraud risk flag |

No official event detected → claim immediately flagged for review.

### Layer 2 — Historical Weather Verification

```
If rainfall_today >= 90th_percentile(historical_rainfall_same_date):
    event_confidence += HIGH
else:
    fraud_risk += MODERATE
```

Prevents claims during normal weather from passing undetected.

### Layer 3 — Worker Behaviour Risk Score

| Signal | Interpretation |
|---|---|
| High claim frequency | Elevated risk |
| Repeated recent claims | Higher suspicion |
| Stable long-term work history | Lower risk |
| Sudden unexplained inactivity | Possible manipulation |
| Irregular income patterns | Potential fraud indicator |

```
worker_risk =
    w1 * claim_history_score
  + w2 * work_activity_pattern_score
  + w3 * income_drop_pattern_score
```

### Layer 4 — Platform Activity Verification

Checks via Swiggy / Zomato / Blinkit APIs:
- Was the worker logged in before the event?
- Were deliveries completed before disruption?
- Did inactivity begin exactly at claim submission?

### Layer 5 — Income Pattern Analysis

```
Baseline Income = Total Earnings (last 4–8 weeks) ÷ Working Days
```

| Pattern | Interpretation |
|---|---|
| Gradual income drop | Likely genuine disruption |
| Partial earnings retained | Consistent with real disaster |
| Instant zero income at claim start | Suspicious — possible intentional stoppage |

### Layer 6 — Zone-Based Risk Analysis

| Zone | Workers | Claims | Signal |
|---|---|---|---|
| Zone A | 100 | 40 claims | Supports genuine event |
| Zone B | 100 | 3 claims | Suspicious if disaster declared |

### Layer 7 — Nearby Zone Cross-Validation

Genuine disasters affect multiple adjacent areas. Isolated high claim rates with no neighbouring zone impact = investigation triggered.

| Zone | Claim Rate |
|---|---|
| Zone A | 42% |
| Zone B | 39% |
| Zone C | 35% |

### Layer 8 — Behavioral Baseline Deviation

```
behavior_deviation =
    Δ working_hours + Δ login_pattern + Δ income_pattern
  + Δ delivery_density + zone_shift_indicator
```

**Detecting Intentional Work Stoppage:**

```
Normal week:  Mon: 7hrs | Tue: 8hrs | Wed: 6hrs | Thu: 7hrs
Claim week:   Mon: 7hrs | Tue: 8hrs | Wed: 0hrs | Thu: 0hrs
```

**Peer Comparison — Outlier Detection:**

| Worker | Income Drop |
|---|---|
| Worker A | –70% |
| Worker B | –65% |
| Worker C | –68% |
| Worker D | –100% flagged |

---

## Final Fraud Probability Score

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

Weights are **retrained continuously** on labelled historical claims.

### Decision Thresholds

| P(fraud) | Action |
|---|---|
| 0–20% | Auto-approve |
| 20–50% | Fast automated review |
| 50–80% | Manual review |
| 80%+ | Reject / investigate |

> Expected outcome: **80–90% of valid claims auto-approved.**

---

## Graph-Based Fraud Ring Detection

- **Nodes** = Workers, Devices, Payment Accounts, Zones
- **Edges** = Shared identifiers (device ID, UPI handle, bank account, claim timing)

### Edge Types

| Shared Attribute | Edge Weight |
|---|---|
| Same UPI / bank account | High |
| Same device ID | High |
| Same phone number | High |
| Same zone + simultaneous claim | Medium |
| Similar income drop pattern | Low–Medium |

### Cluster Risk Formula

```
cluster_risk =
    0.4 * claim_time_similarity
  + 0.3 * location_overlap
  + 0.2 * income_pattern_similarity
  + 0.1 * device_or_payment_link
```

### Automated Claim Processing Summary

| Claim Category | Expected Volume | Handling |
|---|---|---|
| Low risk (P < 0.20) | ~80–90% | Automatic approval |
| Medium risk (0.20–0.50) | ~5–10% | Fast automated review |
| High risk (0.50–0.80) | ~3–5% | Manual investigation |
| Fraud ring flagged | <2% | Reject / deep investigation |

---

# MODULE 3 — Parametric Automation

## What This Module Does

When a natural disaster or severe weather event hits a registered city:

- Detects the event automatically via IMD weather alerts
- Opens claim records for every eligible worker automatically
- Monitors each worker's daily income for up to 7 days
- If income stays below 50% of normal for 5 consecutive days → money sent automatically

**The worker never files a claim. The system handles everything. Target payout: 48–72 hours.**

---

## How the Three Sub-modules Fit Together

| Sub-module | Role |
|---|---|
| Sub-module 1 — Real-time Trigger Monitoring | Calls IMD APIs every 15 minutes, classifies alert, matches to worker zones |
| Sub-module 2 — Automatic Claim Initiation | Creates claim records, monitors daily income for 5 consecutive loss days |
| Sub-module 3 — Instant Payout Processing | Calculates payout, sends via UPI, notifies worker, writes audit log |

---

## Sub-module 1 — Real-time Trigger Monitoring

### IMD APIs Used

| API | Purpose |
|---|---|
| `warnings_district_api.php?id={obj_id}` | 5-day weather forecast per district |
| `nowcast_district_api.php?id={obj_id}` | Real-time current weather |

> **API Access:** Email `helpdesk[at]imd.gov.in` to whitelist your server IP. Free access.
> **Fallback:** `weather.indianapi.in` as commercial backup — no IP whitelisting required.

### Alert Color Classification

| Color | Severity | Platform Action |
|---|---|---|
| 🔴 Red | Severe — cyclone, extremely heavy rain | Trigger fires for **all zones (A, B, C)** |
| 🟠 Orange | Significant — moderate-heavy rain | Trigger fires for **Zone A only** |
| 🟡 Yellow | Minor — light rain | No trigger — log only |
| 🟢 Green | No event | No action |

> **Yellow logging:** Three or more consecutive Yellow days in a zone → escalate for manual review.

**Deduplication:** One trigger per district per day maximum.

---

## Sub-module 2 — Automatic Claim Initiation

### Phase 1 — Immediate *(runs once when trigger fires)*
- Fetch all workers in triggered zone with active policy and paid premium
- Create claim record per worker → status: `monitoring`, loss counter: `0`

### Phase 2 — Daily Income Check *(runs every midnight)*
- Pull today's earnings from platform API
- Below 50% of baseline → loss counter **+1**
- At or above 50% → counter **resets to zero**
- Counter reaches **5** → status moves to `payout_ready`

### Baseline Income Calculation

```
Baseline Daily Income = Total Earnings (last 4 weeks) ÷ Working Days
```

### Worker Inactivity Scenarios

| Scenario | Pre-event Activity | During Event | Outcome |
|---|---|---|---|
| A — Disaster forced zero income | Active last 7 days | Zero earnings, zero logins | Eligible |
| B — Platform outage | Active last 7 days | Zero earnings, outage logged | Eligible |
| C — Voluntarily stopped | Active last 7 days | Zero earnings but logged in | Manual review |
| D — Already inactive | Not active 7 days prior | No activity | Rejected |

---

## Sub-module 3 — Instant Payout Processing

### Payout Calculation

| Days Lost | Payout |
|---|---|
| 5 days | 70% of weekly coverage |
| 6 days | 85% of weekly coverage |
| 7 days | 100% of weekly coverage |

- **Primary:** UPI transfer to worker's registered UPI ID
- **Fallback:** Direct bank transfer if UPI unavailable

### Audit Log Fields

| Field | Purpose |
|---|---|
| Trigger date | When disaster was detected |
| Alert level | Red or Orange |
| Days of income lost | What drove the payout amount |
| Payout amount | Exact amount disbursed |
| Transaction ID | UPI or bank reference |
| Timestamp | When payment was sent |

---

## Claim Status Flow

```
monitoring
    │
    ├──► payout_ready ──► closed
    │
    ├──► manual_review    (Scenario C or fraud flag)
    │
    └──► rejected         (Scenario D or fraud detection)
```

---

## End-to-End Flow

```
Day 0 — Disaster hits
→ IMD issues Red/Orange alert
→ Poller detects within 15 minutes
→ Deduplication check passes
→ Claim records opened for all eligible workers (status: monitoring)

Day 1–4 — Daily midnight job runs
→ Earnings below 50% baseline → loss counter increments
→ Earnings above 50% → counter resets
→ Counter not yet at 5 — monitoring continues

Day 5 — Counter reaches 5
→ Claim status → payout_ready
→ Payout calculated (70% of weekly coverage)
→ UPI transfer dispatched
→ Worker notified via SMS and push
→ Audit log written
→ Claim status → closed
```

---

## Financial Sustainability Targets

| Metric | Target |
|---|---|
| Loss Ratio | 55–65% |
| Expense Ratio | ~25% |
| Profit Margin | 10–15% |
| Reinsurance Partner | GIC Re / Munich Re |

---

## 📄 License

This project is proprietary. All rights reserved.