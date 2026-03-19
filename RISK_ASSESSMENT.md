# InsureOn — Risk Assessment & Pricing

A parametric income loss insurance platform designed for delivery gig workers, providing coverage against natural disasters, extreme weather, and other disruptions — with smart work optimization guidance built in.

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

## Worker Personas

Based on real worker interviews, two primary personas have been identified:

### Persona 1 — Part-time Worker "Ravi"
- Works **10–25 hrs/week**
- Earns approximately **₹4,000/week**
- Willing to spend **₹100/week** on insurance
- Treats delivery as supplementary income
- Key concern: losing even partial income during disasters

### Persona 2 — Full-time Worker "Karthik"
- Works **40+ hrs/week**
- Earns approximately **₹11,000/week** (≈ ₹44,000/month)
- Treats delivery as primary income
- Key concern: complete income wipeout during extended disasters

---

## Tier Structure

Workers are dynamically assigned to tiers based on their **4-week average weekly working hours**:

| Tier | Weekly Working Hours | Worker Type | Real Persona |
|---|---|---|---|
| Tier 1 | 10–25 hrs/week | Part-time / Occasional | "Ravi" |
| Tier 2 | 26–40 hrs/week | Regular Worker | In between |
| Tier 3 | 41+ hrs/week | Full-time / Power Worker | "Karthik" |

---

## Pricing Structure

> Pricing is anchored to real worker data:
> - Part-time worker (₹4,000/week) → willing to pay **₹100/week**
> - Full-time worker (up to ₹12,000/week i.e. ₹48,000/month) → scales proportionally
> - Coverage = **70% of average weekly income**
> - Premium = **~2.5% of coverage amount** (Zone A base)

### Premium Rate by Zone

| Zone | Premium as % of Coverage |
|---|---|
| Zone A (High Risk) | 2.5% |
| Zone B (Moderate Risk) | 1.7% |
| Zone C (Low Risk) | 1.2% |

---

### Tier 1 — Part-time (10–25 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 10–15 hrs | ₹1,500–₹2,500 | ₹1,750 | ₹44/week | ₹30/week | ₹21/week |
| 16–20 hrs | ₹2,501–₹3,500 | ₹2,450 | ₹61/week | ₹42/week | ₹29/week |
| 21–25 hrs | ₹3,501–₹4,500 | ₹2,800 | **₹100/week** | ₹68/week | ₹48/week |

> Ravi (₹4,000/week, Zone A) falls in the 21–25 hrs band → **₹100/week** — matches willingness to pay exactly.

---

### Tier 2 — Regular (26–40 hrs/week)

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 26–30 hrs | ₹4,501–₹6,500 | ₹3,850 | ₹137/week | ₹93/week | ₹66/week |
| 31–35 hrs | ₹6,501–₹8,500 | ₹5,250 | ₹175/week | ₹119/week | ₹84/week |
| 36–40 hrs | ₹8,501–₹10,500 | ₹6,650 | ₹210/week | ₹143/week | ₹101/week |

---

### Tier 3 — Full-time (41+ hrs/week)

> Maximum weekly income capped at **₹12,000/week (₹48,000/month)**

| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 41–50 hrs | ₹10,501–₹11,000 | ₹7,500 | ₹190/week | ₹130/week | ₹90/week |
| 51–60 hrs | ₹11,001–₹11,500 | ₹7,850 | ₹195/week | ₹135/week | ₹95/week |
| 61–70 hrs | ₹11,501–₹12,000 | ₹8,200 | ₹205/week | ₹140/week | ₹100/week |
| 71+ hrs | ₹12,000+ | ₹8,400 | ₹210/week | ₹145/week | ₹100/week |

> Karthik (₹11,000/week, Zone A) falls in the 41–50 hrs band → **₹190/week** — proportional and sustainable.

---

## Premium Loading & Discounts

| Condition | Adjustment |
|---|---|
| No claims in past 6 months | –10% discount |
| Multi-platform worker | –5% discount |
| Coastal / flood-prone pincode | +20–30% loading |
| Shorter waiting period opted (12hr vs 48hr) | +15% loading |
| Annual payment upfront | –8% discount |
| Risk score "Low" category | –15% discount |
| Risk score "Very High" category | +40% loading |

> **Loading** = extra charge added due to higher risk
> **Discount** = reduction applied for lower risk or loyalty

---

## Predictive Risk Modeling — Persona Specific

Each worker gets a **personal risk score** calculated weekly. This score adjusts their premium multiplier on top of the base tier rate.

### Step 1: Risk Factor Scoring

| Factor | Low Risk (1) | Medium Risk (2) | High Risk (3) | Weight |
|---|---|---|---|---|
| Zone | Zone C | Zone B | Zone A | 30% |
| Pincode disaster frequency | <2 days/yr | 2–5 days/yr | 5+ days/yr | 25% |
| Weekly working hours | <20 hrs | 20–40 hrs | 40+ hrs | 20% |
| Work time of day | Afternoon | Morning | Night / Rain hours | 15% |
| Past claim history | 0 claims | 1 claim | 2+ claims | 10% |

### Step 2: Weighted Risk Score Formula

```
Risk Score = (Zone × 0.30) + (Pincode Freq × 0.25) + (Work Hours × 0.20)
           + (Work Time × 0.15) + (Claim History × 0.10)
```

### Step 3: Risk Category & Premium Multiplier

| Risk Score | Category | Premium Multiplier |
|---|---|---|
| 1.0 – 1.5 | 🟢 Low Risk | 0.85× |
| 1.6 – 2.0 | 🟡 Medium Risk | 1.00× |
| 2.1 – 2.5 | 🟠 High Risk | 1.20× |
| 2.6 – 3.0 | 🔴 Very High Risk | 1.40× |

---

### Persona Risk Score Examples

#### Ravi (Part-time, Zone A)

| Factor | Score | Weight | Weighted |
|---|---|---|---|
| Zone A | 3 | 30% | 0.90 |
| Pincode (flood-prone) | 3 | 25% | 0.75 |
| Work Hours (20 hrs) | 1 | 20% | 0.20 |
| Work Time (afternoon) | 1 | 15% | 0.15 |
| Claim History (0 claims) | 1 | 10% | 0.10 |
| **Total Risk Score** | | | **2.10 → 🟠 High Risk** |

```
Ravi's Final Premium = ₹100 × 1.20 = ₹120/week
```

> Ravi is in a high-risk zone but works fewer hours in the afternoon — partially offsets the zone risk.

---

#### Karthik (Full-time, Zone A)

| Factor | Score | Weight | Weighted |
|---|---|---|---|
| Zone A | 3 | 30% | 0.90 |
| Pincode (flood-prone) | 3 | 25% | 0.75 |
| Work Hours (45 hrs) | 3 | 20% | 0.60 |
| Work Time (night shifts) | 3 | 15% | 0.45 |
| Claim History (1 claim) | 2 | 10% | 0.20 |
| **Total Risk Score** | | | **2.90 → 🔴 Very High Risk** |

```
Karthik's Final Premium = ₹190 × 1.40 = ₹266/week
```

> Karthik works full-time night shifts in a flood zone with a prior claim — very high risk profile.

---

### ML Model Upgrade Path

| Stage | Approach |
|---|---|
| Launch (0–6 months) | Rule-based weighted scoring above |
| Growth (6–12 months) | Logistic Regression / Decision Tree on claims data |
| Scale (12+ months) | XGBoost / Random Forest with pincode-level granularity |

> Every week of data collected today becomes training data for the ML model tomorrow.

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

## Claim Eligibility Rules

A claim is valid when **all three** conditions are met:

1. An **official disaster/weather event** is declared in the worker's registered zone (IMD Red/Orange alert or government notification)
2. The worker's daily income falls **below 50% of their daily average** for a **minimum of 5 consecutive days**
3. The worker was **actively working** (logged into platform) before the event occurred

### Minimum Daily Income Baseline

```
Baseline Daily Income = Total earnings over last 4–8 weeks ÷ Number of working days
```

**Example (Ravi):**
Earned ₹16,000 over 4 weeks across 20 working days → Baseline = ₹800/day
Claim triggers if he earns below ₹400/day for 5+ consecutive days.

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

## SmartWork — Work Optimization Feature

InsureOn doesn't just protect workers — it **actively helps them earn more** by telling them the best times and conditions to work each week.

### What SmartWork Does

Every week, each worker receives personalized guidance on:
- **Best time slots** to work for maximum orders
- **High-earning zones** in their city this week
- **Weather windows** — safe periods before/after predicted rain
- **Surge period alerts** — festivals, events, weekends with high demand
- **Risk advisories** — when NOT to work to stay safe

### SmartWork for Part-time Workers (Tier 1)

```
SmartWork Tips — This Week

Best Time Slots:
   → Weekday evenings 7–9 PM   (dinner rush, highest order density)
   → Saturday 12–2 PM          (lunch peak, strong surge)
   → Sunday 7–10 PM            (highest surge of the week)

High-Earning Zones This Week:
   → Areas with high restaurant density (short distances, more orders/hr)
   → Residential zones near commercial hubs (high drop-off demand)

Weather Window:
   → Check rain forecast before heading out
   → Avoid working during active rain (low orders, high personal risk)
   → Clear weather days = best earning opportunity

This Week's Target:
   → Concentrate hours in recommended slots
   → Projected earnings: 10–15% above your usual weekly average

Risk Advisory:
   → IMD alerts active in your zone — avoid working during alert hours
   → Wrap up before predicted weather events
```

### SmartWork for Full-time Workers (Tier 3)

```
SmartWork Tips — This Week

Optimal Shift Structure:
   → Split shifts recommended: Late morning + Evening
   → Avoid mid-afternoon (low order density, high fuel cost per order)
   → Night shifts during weekends = highest earning potential

Zone Rotation Strategy:
   → Weekdays → Office and commercial zones (lunch + corporate orders)
   → Evenings → Residential and dining areas (dinner rush)
   → Weekends → High-footfall zones (shopping, entertainment areas)

Weather Strategy:
   → Light rain = surge pricing opportunity (worth staying out)
   → Heavy rain / storm = stop immediately, safety first
   → Plan rest/recovery after high-intensity rain-surge shifts

Earnings Optimization:
   → You don't need to work more hours — just shift when you work
   → Following zone rotation can add ₹1,000–₹2,000/week
     without adding a single extra hour

Risk Advisory:
   → Active weather watch in your area this week
   → Keep insurance active — higher payout probability this week
```

### How SmartWork Data is Generated

| Data Source | Used For |
|---|---|
| Platform order history (Swiggy / Zomato / Dunzo API) | Peak hour and zone identification |
| IMD weather forecast API | Rain and storm windows |
| City event calendar | Festivals, matches, local events causing surges |
| Worker's own past earnings data | Personalized slot recommendations |
| NDMA alerts | Risk advisories and safety warnings |

### SmartWork Delivery Channels

| Channel | When |
|---|---|
| Push notification | Every Monday morning — weekly tips |
| In-app dashboard | Live surge zone map, updated daily |
| SMS alert | Urgent risk advisories (IMD red/orange alerts) |
| Weekly earnings report | Actual earnings vs SmartWork projected earnings |

### SmartWork Impact on Risk Score & Premium

| Worker Behavior | Risk Score Impact |
|---|---|
| Follows weather avoidance tips | –0.2 risk score reduction |
| Avoids working during IMD alerts | –0.3 risk score reduction |
| Consistently works recommended safe slots | Eligible for **"Safe Worker" discount (–5% premium)** |

### SmartWork — Summary of Benefits

| Benefit | For Part-time Worker | For Full-time Worker |
|---|---|---|
| Earnings boost | +10–15% by choosing right hours | +₹1,000–₹2,000/week by shifting zones |
| Safety | Avoid disaster-prone hours | Early warning before storms |
| Premium savings | Safe behaviour reduces risk score | Safe behaviour reduces risk score |
| Effort required | Zero — tips delivered every Monday | Zero — tips delivered every Monday |

---

## Financial Sustainability Targets

| Metric | Target |
|---|---|
| Loss Ratio | 55–65% |
| Expense Ratio | ~25% |
| Profit Margin | 10–15% |
| Reinsurance Partner | GIC Re / Munich Re |

---

## Why This Model Works

| Advantage | Reason |
|---|---|
| **Priced for real workers** | ₹100/week anchor matches actual willingness to pay |
| **Fair & proportional** | Coverage and premium scale with actual income |
| **Fraud resistant** | Coverage based on verified platform data |
| **Personalised** | Risk score adjusts premium per individual worker |
| **Value beyond insurance** | SmartWork helps workers earn more, not just get covered |
| **Scalable** | Fully automatable with gig platform API integration |
| **ML-ready** | Rule-based today, upgrades to ML model after 6 months |

---

## 📄 License

This project is proprietary. All rights reserved.