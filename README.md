# InsureOn — Income Protection Insurance for Delivery Gig Workers

A parametric income loss insurance platform designed for delivery gig workers, providing coverage against natural disasters, extreme weather, and other disruptions.

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

Workers are assigned to a zone based on their registered city/pincode:

| Zone | Risk Level | Example Cities |
|---|---|---|
| 🔴 Zone A | High Risk | Chennai, Mumbai, Kolkata |
| 🟡 Zone B | Moderate Risk | Bengaluru, Hyderabad, Ahmedabad |
| 🟢 Zone C | Low Risk | Delhi, Pune, Jaipur |

Zone data is sourced from **IMD (India Meteorological Department)** and **NDMA** historical disruption records.

---

## Tier Structure

Workers are dynamically assigned to tiers based on their **4-week average weekly working hours**:

| Tier | Weekly Working Hours | Worker Type |
|---|---|---|
| Tier 1 | 10–25 hrs/week | Part-time / Occasional |
| Tier 2 | 26–40 hrs/week | Regular Worker |
| Tier 3 | 41+ hrs/week | Full-time / Power Worker |

---

## Dynamic Coverage & Weekly Premium Structure

Coverage is calculated at **70% of the worker's average weekly income**, derived from their working hours. Premiums scale with both hours worked and zone risk.

### 🔵 Tier 1 — Part-time (10–25 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage Amount | Premium Zone A | Premium Zone B | Premium Zone C |
|---|---|---|---|---|---|
| 10–15 hrs | ₹1,000–₹2,000 | ₹1,500 | ₹25/week | ₹18/week | ₹12/week |
| 16–20 hrs | ₹2,001–₹3,500 | ₹2,750 | ₹40/week | ₹28/week | ₹20/week |
| 21–25 hrs | ₹3,501–₹5,000 | ₹4,250 | ₹55/week | ₹38/week | ₹27/week |

### 🟡 Tier 2 — Regular (26–40 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage Amount | Premium Zone A | Premium Zone B | Premium Zone C |
|---|---|---|---|---|---|
| 26–30 hrs | ₹5,001–₹7,000 | ₹6,000 | ₹85/week | ₹60/week | ₹42/week |
| 31–35 hrs | ₹7,001–₹9,000 | ₹8,000 | ₹110/week | ₹78/week | ₹55/week |
| 36–40 hrs | ₹9,001–₹11,000 | ₹10,000 | ₹135/week | ₹95/week | ₹67/week |

### 🔴 Tier 3 — Full-time (41+ hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage Amount | Premium Zone A | Premium Zone B | Premium Zone C |
|---|---|---|---|---|---|
| 41–50 hrs | ₹11,001–₹14,000 | ₹12,500 | ₹170/week | ₹120/week | ₹85/week |
| 51–60 hrs | ₹14,001–₹18,000 | ₹16,000 | ₹210/week | ₹148/week | ₹105/week |
| 60+ hrs | ₹18,001+ | ₹20,000 | ₹260/week | ₹183/week | ₹130/week |

### Premium as % of Weekly Coverage by Zone

| Zone | Premium Rate |
|---|---|
| Zone A (High Risk) | 1.5–2.0% of coverage |
| Zone B (Moderate) | 1.0–1.5% of coverage |
| Zone C (Low Risk) | 0.7–1.0% of coverage |

---

## Premium Loading & Discounts

| Condition | Adjustment |
|---|---|
| No claims in past 6 months | –10% discount |
| Multi-platform worker | –5% discount |
| Coastal / flood-prone pincode | +20–30% loading |
| Shorter waiting period opted (12hr vs 48hr) | +15% loading |
| Annual payment upfront | –8% discount |

> **Loading** = extra charge added due to higher risk  
> **Discount** = reduction applied for lower risk or loyalty

---

## Dynamic Reassignment Logic

Every Monday, the system recalculates each worker's tier and coverage:

```
Every Monday:
→ System checks last 4-week average working hours
→ Assigns worker to appropriate Tier + Hour Band
→ Calculates new coverage amount (70% of avg weekly income)
→ Applies Zone loading (A / B / C)
→ Charges weekly premium
→ Issues digital policy for that week
→ If disaster event triggers → checks 5-day loss rule → pays out
```

### Tier Transition Rules

| Situation | Rule |
|---|---|
| Worker moves UP a tier | New higher coverage applies next week |
| Worker moves DOWN a tier | Coverage steps down with 1-week buffer |
| Worker goes inactive | Coverage pauses after 2 weeks of zero activity |
| Worker resumes activity | Coverage resumes from next Monday |

---

## 🛡️ Claim Eligibility Rules

A claim is valid when **all three** conditions are met:

1. An **official disaster/weather event** is declared in the worker's registered zone (IMD Red/Orange alert or government notification)
2. The worker's daily income falls **below 50% of their daily average** for a **minimum of 5 consecutive days**
3. The worker was **actively working** (logged into platform) before the event occurred

### Minimum Daily Income Baseline

```
Baseline Daily Income = Total earnings over last 4–8 weeks ÷ Number of working days
```

**Example:**  
Worker earned ₹24,000 over 4 weeks across 24 working days → Baseline = ₹1,000/day  
Claim triggers if they earn below ₹500/day (50%) for 5+ consecutive days.

---

## Payout Structure

| Days of Confirmed Loss | Payout |
|---|---|
| 1–4 days | No payout (below minimum threshold) |
| 5 days | 70% of weekly coverage amount |
| 6 days | 85% of weekly coverage amount |
| 7 days | 100% of weekly coverage amount |

**Payout timeline:** Within 48–72 hours of claim approval.

---

## Financial Sustainability Targets

| Metric | Target |
|---|---|
| Loss Ratio | 55–65% |
| Expense Ratio | ~25% |
| Profit Margin | 10–15% |
| Reinsurance | GIC Re / Munich Re for catastrophic events |

---

## Why This Model Works

| Advantage | Reason |
|---|---|
| **Fair** | Workers pay exactly for the coverage they need |
| **Fraud resistant** | Coverage based on verified platform data, not self-declaration |
| **Scalable** | Fully automatable with gig platform API integration |
| **Flexible** | Adjusts naturally to seasonal and weekly work patterns |
| **Affordable** | Part-timers are never overcharged |

---