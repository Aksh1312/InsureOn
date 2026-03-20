# InsureOn - Income Protection Insurance for Delivery Gig Workers


We are designing a parametric income loss insurance platform for delivery gig workers, providing coverage against natural disasters, extreme weather, and other disruptions - with automated fraud detection and payouts. We have chosen to focus on food delivery partners like Swiggy, Zomato, etc...

We think that India has gracefully embraced the ordering-in culture. All around the nation, people (mostly people like us) prefer ordering in than to going out to eat. Such conviniences are only possible due to the hard workers completing hundreds of gigs, so that people get their food (and the workers their money).

Apart from the motivation of building InsureOn just for winning the DEVTrails2026, we also feel inspired by the response from the gig workers in and around our locality.

We apologize beforehand for such a very long readme document, and we thank you for your patience.

If possible, please leave us a Github issue so that we may correct ourselves.


## What We Cover

We aim to cover income loss for delivery gig workers including but not limited to:
- Natural disasters (floods, cyclones, earthquakes)
- Extreme weather (heavy rain, storms preventing delivery, unbearable heat)
- Civil unrest / curfews and other similar problems
- Platform outages

## Zone Classification

We decided that splitting major operating into zones will help us make a structured architecture for the working of InsureOn.

We separated them based on how often a worker can be disrupted, taking factors such as frequency of natural disasters or extreme weather, where curfews, riots and strikes are common, and how economically active a city is (cuz the more active it is, the more gigs it should have, and statistically should have higher number of distruptions). 

| Zone | Risk Level | Example Cities |
|---|---|---|
| 🔴 Zone A | High Risk | Chennai, Mumbai, Kolkata |
| 🟡 Zone B | Moderate Risk | Bengaluru, Hyderabad, Ahmedabad |
| 🟢 Zone C | Low Risk | Delhi, Pune, Jaipur |

Zone data is sourced from **IMD (India Meteorological Department)** and **NDMA** historical disruption records.

---

# MODULE 1 - Risk Assessment & Pricing

## 👥 Worker Personas

Based on some of the workers we interviewed live and some data we collected from feedbacks on Reddit, we classify workers into two personas.

### 🔵 Persona 1 - Part-time Worker "Ravi"
- Works **10–25 hrs/week**, earns ~**₹4,000/week**
- Willing to spend **₹100/week** on insurance
- Treats delivery as supplementary income

Workers with the *"Ravi"* persona are people who feel that gig work is not essential for day to day life, but still rely on making deliveries to maintain flexibility in life, like saving up for a phone upgrade or similar. He prefers short distance jobs and works mainly on some peak hours when he is available. He feels risk abstract now, and some people in situations like *"Ravi"* may feel that insurance is a waste of money.

### 🔴 Persona 2 - Full-time Worker "Karthik"
- Works **40+ hrs/week**, earns ~**₹11,000/week** (≈ ₹44,000/month)
- Treats delivery as primary income
- Key concern: complete income wipeout during extended disasters

Workers with the *"Karthik"* persona completety depend on the gig economy for their bread and butter. They work tirelessly throughout the week to make their ends meet. They are the people see that having insurance is very important. He may feel trapped due to losing money in effect of a situation that he cannot control.

---

## Tier Structure

Based on the forementioned classifications and the data we have, InsureOn offers workers tiers based on their **4-week average weekly working hours**:

| Tier | Weekly Working Hours | Worker Type |
|---|---|---|
| Tier 1 | 10–25 hrs/week | Part-time / Occasional |
| Tier 2 | 26–40 hrs/week | Regular Worker |
| Tier 3 | 41+ hrs/week | Full-time / Power Worker |

---

## Pricing Structure
 
InsureOn aims to cover **70% of average weekly income** with a premium model of **~2.5% of coverage** (Zone A base) and maximum weekly income in Tier 3 capped at **₹12,000/week (₹48,000/month)**
 
### Premium Rate by Zone
 
| Zone | Premium as % of Coverage |
|---|---|
| Zone A (High Risk) | 2.5% |
| Zone B (Moderate Risk) | 1.7% |
| Zone C (Low Risk) | 1.2% |
 
---
 
### Tier 1 - Part-time (₹1,500–₹4,500/week)
 
| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 10–15 hrs | ₹1,500–₹2,500 | ₹1,400 | ₹35/week | ₹25/week | ₹15/week |
| 16–20 hrs | ₹2,501–₹3,500 | ₹2,100 | ₹50/week | ₹35/week | ₹25/week |
| 21–25 hrs | ₹3,501–₹4,500 | ₹2,800 | ₹70/week | ₹50/week | ₹35/week |
 
---
 
### Tier 2 - Regular (₹4,501–₹8,000/week)
 
| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 26–30 hrs | ₹4,501–₹5,500 | ₹3,500 | ₹90/week | ₹60/week | ₹40/week |
| 31–35 hrs | ₹5,501–₹6,750 | ₹4,300 | ₹110/week | ₹75/week | ₹50/week |
| 36–40 hrs | ₹6,751–₹8,000 | ₹5,150 | ₹130/week | ₹90/week | ₹60/week |
 
> Ravi (₹4,000/week, Zone A) falls at the entry of Tier 2 → **~₹90/week base premium** - close to his stated willingness of ₹100/week.
 
---
 
### Tier 3 - Full-time (₹8,001–₹12,000+/week)
 
> Maximum weekly income capped at **₹12,000/week (₹48,000/month)**
 
| Weekly Hours | Est. Weekly Income | Coverage (70%) | Zone A | Zone B | Zone C |
|---|---|---|---|---|---|
| 41–50 hrs | ₹8,001–₹9,500 | ₹6,100 | ₹150/week | ₹105/week | ₹75/week |
| 51–60 hrs | ₹9,501–₹11,000 | ₹7,150 | ₹180/week | ₹120/week | ₹85/week |
| 61–70 hrs | ₹11,001–₹12,000 | ₹8,050 | ₹200/week | ₹135/week | ₹95/week |
| 71+ hrs | ₹12,000+ | ₹8,400 | ₹210/week | ₹145/week | ₹100/week |
 
> Karthik (₹11,000/week, Zone A) falls in the 61–70 hrs band → **₹200/week base premium** - proportional and sustainable.
 
---

## Premium Loading & Discounts

InsureOn offers premium recalculation that may increase or decrease for the following possible conditions:

| Condition | Adjustment |
|---|---|
| No claims in past 6 months | –10% discount |
| Multi-platform worker | –5% discount |
| Coastal / flood-prone pincode | +20–30% loading |
| Shorter waiting period (12hr vs 48hr) | +15% loading |
| Annual payment upfront | –8% discount |
| Risk score "Low" category | –15% discount |
| Risk score "Very High" category | +40% loading |

These (we hope) encourages the gig workers to be more professional in their work.

---

## Predictive Risk Modeling

Each worker receives a **personal risk score** that is calculated weekly, adjusting their premium multiplier on top of the base tier rate.

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

For example, let us consider our two personas

**Ravi** → Risk Score **2.10 → 🟠 High Risk** → ₹100 × 1.20 = **₹120/week**

**Karthik** → Risk Score **2.90 → 🔴 Very High Risk** → ₹190 × 1.40 = **₹266/week**

### ML Upgrade Path

Depending the results from running the product in simulation and general performance metrics, we plan on the following path to take

| Stage | Approach |
|---|---|
| Launch (0–6 months) | Rule-based weighted scoring |
| Growth (6–12 months) | Logistic Regression / Decision Tree |
| Scale (12+ months) | XGBoost / Random Forest, pincode-level |

We also plan to use Reinforcement Learning to learn patterns if needed.

---

## Dynamic Weekly Reassignment

The following schedule is followed every Monday:

```
→ Pull worker's last 4-week average hours and earnings from platform API
→ Pull latest IMD / NDMA risk data for their pincode
→ Recalculate personal Risk Score
→ Assign Hour Band
→ Apply Zone rate + Risk Score multiplier
→ Apply any loadings or discounts
→ Charge final weekly premium
→ Issue digital policy for that week
→ Send worker their SmartWork tips for the week
```

## Claim Eligibility

A claim is **Eligible to be applied** when **all three** conditions are met:

1. Official **IMD Red/Orange alert** declared in the worker's zone
2. Patterns must coincide with the worker's activity
3. Worker was **actively working** before the event

Please note that this is only the eligibility criteria for application of a manual claim, while automated claims are explained further below.

### Payout Structure

| Days of Confirmed Loss | Payout |
|---|---|
| 1–4 days | No payout |
| 5 days | 70% of weekly coverage |
| 6 days | 85% of weekly coverage |
| 7 days | 100% of weekly coverage |

The payout will be optimized to be sanctioned within 24-48 hours

---

## SmartWork - Work Optimization Feature

InsureOn doesn't just protect workers - it **actively helps them reduce risk** every week, and thereby increasing their income.

### What SmartWork Does
By analyzing the API data and existing historical data, we provide the following recommendations:
- **Best time slots** to work for maximum orders
- **High-earning zone** recommendations in their city
- **Weather windows** - safe periods before/after rain
- **Surge alerts** - festivals, weekends, events with high demand
- **Risk advisories** - when NOT to work for safety

### Sample SmartWork report

```
SmartWork Tips - This Week

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
   → IMD alerts active in your zone - avoid working during alert hours

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
   → You don't need more hours - just shift when you work
   → Zone rotation can add ₹1,000–₹2,000/week without extra hours

Risk Advisory:
   → Active weather watch this week - keep insurance active
```

### SmartWork Data Sources

We arrive at the report based on data from the sources:

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
| Push notification | Every Monday morning - weekly tips |
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

# MODULE 2 - Fraud Detection System

## Why We Built It This Way

Let’s face it: insurance fraud is a real problem, but we believe most gig workers are honest. That’s why our system is “parametric”-meaning, claims are triggered by real-world events (like official weather alerts), not just someone saying “I lost income.” This wipes out most of the usual fraud headaches. For the rest, we use a smart, multi-layered approach-think of it as a security system with eight different locks, all working together. (If you’ve ever played Metal Gear Solid, you know: the more layers of security, the better. Just don’t get spotted by the exclamation mark)

## System Architecture (The Big Picture)

Here’s how our fraud detection system works under the hood. Think of it as a funnel, with each layer filtering out suspicious claims, so only the genuine ones make it through:

```
Raw Signals
      │
      ├── Layer 1 - Event Verification
      ├── Layer 2 - Historical Weather Comparison
      ├── Layer 3 - Worker Behaviour Risk Score
      ├── Layer 4 - Platform Activity Verification
      ├── Layer 5 - Income Pattern Analysis
      ├── Layer 6 - Zone-Based Correlation
      ├── Layer 7 - Nearby Zone Cross-Validation
      └── Layer 8 - Behavioral Baseline Deviation
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

## The 8 Detection Layers (With a Personal Touch)

We don’t just rely on one check, we layer them up. Here’s what each layer does (and why it matters):

### Layer 1 - Event Verification
Checks if a disaster really happened using official sources (IMD, NDMA, state alerts). If there’s no official event, the claim is flagged right away.

| Alert Level | Signal Strength |
|---|---|
| Red Alert | Strong confirmation |
| Orange Alert | Moderate confirmation |
| Yellow Alert | Weak confirmation |
| No Alert | High fraud risk flag |

### Layer 2 - Historical Weather Verification
We compare today’s weather to historical data. If it’s not unusually bad, we get suspicious.

```
If rainfall_today >= 90th_percentile(historical_rainfall_same_date):
      event_confidence += HIGH
else:
      fraud_risk += MODERATE
```

### Layer 3 - Worker Behaviour Risk Score
We look at the worker’s history. Are they making claims all the time? Did they suddenly stop working? Or do they have a steady, honest record?

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

### Layer 4 - Platform Activity Verification

We check with Swiggy, Zomato, Blinkit, etc. Was the worker logged in before the event? Were they actually working? Did they go inactive right at claim time? (No rage-quitting allowed)

### Layer 5 - Income Pattern Analysis
We look for natural, gradual drops in income (which are normal in disasters) versus sudden, suspicious zeroes.

```
Baseline Income = Total Earnings (last 4–8 weeks) ÷ Working Days
```

| Pattern | Interpretation |
|---|---|
| Gradual income drop | Likely genuine disruption |
| Partial earnings retained | Consistent with real disaster |
| Instant zero income at claim start | Suspicious - possible intentional stoppage |

### Layer 6 - Zone-Based Risk Analysis
If lots of workers in a zone are affected, it’s probably real. If only one or two are, we look closer.

| Zone | Workers | Claims | Signal |
|---|---|---|---|
| Zone A | 100 | 40 claims | Supports genuine event |
| Zone B | 100 | 3 claims | Suspicious if disaster declared |

### Layer 7 - Nearby Zone Cross-Validation
Disasters don’t respect borders. If only one area is affected, that’s odd. We check if neighboring zones are seeing the same thing.

| Zone | Claim Rate |
|---|---|
| Zone A | 42% |
| Zone B | 39% |
| Zone C | 35% |

### Layer 8 - Behavioral Baseline Deviation

We compare this week to the worker’s usual pattern. Are they suddenly working way less? Are they an outlier compared to their peers? (If you suddenly go from Sonic speed to standing still, we’ll notice.)

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

**Peer Comparison - Outlier Detection:**

| Worker | Income Drop |
|---|---|
| Worker A | –70% |
| Worker B | –65% |
| Worker C | –68% |
| Worker D | –100% flagged |

---

## Final Fraud Probability Score (How We Decide)

All those signals above get mixed together in our machine learning model, which spits out a “fraud probability score.”

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

Weights are retrained continuously on labelled historical claims.

### Decision Thresholds

| P(fraud) | Action |
|---|---|
| 0–20% | Auto-approve |
| 20–50% | Fast automated review |
| 50–80% | Manual review |
| 80%+ | Reject / investigate |

> Expected outcome: **80–90% of valid claims auto-approved.**

---

## Graph-Based Fraud Ring Detection (Catching the Tricksters)

Sometimes, groups try to game the system together. We use a “graph” approach-connecting the dots between workers, devices, payment accounts, and timing. If we see a cluster of suspiciously similar claims, we flag it for deep investigation.

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


## Identifying Genuine Workers Within a Fraud Ring

When a fraud ring is detected, InsureOn does not automatically penalize every worker in the cluster. Instead, we apply a second layer of analysis to protect honest claimants:

- **Individual Behavioral Analysis:** Each worker’s activity, income, and work patterns are compared to their own history and to their peers. Genuine workers show gradual income drops, consistent work, and realistic changes during disasters.
- **Device, Network, and Mobility Checks:** We check device integrity, network consistency, and movement realism. Honest workers have natural movement, degraded network quality during disasters, and no signs of spoofing.
- **Peer Comparison:** Outlier detection helps spot workers whose patterns differ from the rest of the cluster. Genuine workers may have unique, non-synchronized claim timings and diverse behavioral signals.
- **Manual Review for Edge Cases:** If a worker in a flagged cluster passes all individual checks, their claim is prioritized for manual review, not automatic rejection.

**Bottom line:** Even if you’re caught up in a flagged group, the system’s goal is to delay for further verification, not deny, whenever there’s doubt. Honest workers are protected at every step.

# MODULE 3 - Parametric Automation

## What This Module Does (Automation, the InsureOn Way)

When a natural disaster or severe weather event hits a registered city, our system jumps into action-no paperwork, no waiting, just help when it’s needed most.

- Detects the event automatically via IMD weather alerts
- Opens claim records for every eligible worker automatically
- Monitors each worker's daily income for up to 7 days
- If income stays below 50% of normal for 5 consecutive days → money sent automatically

**The worker never files a claim. The system handles everything. Target payout: 48–72 hours.**

---

## How the Three Sub-modules Fit Together (Nuts & Bolts)

Just like a classic RPG party, each sub-module has a special role:

| Sub-module | Role |
|---|---|
| Sub-module 1 - Real-time Trigger Monitoring | Calls IMD APIs every 15 minutes, classifies alert, matches to worker zones |
| Sub-module 2 - Automatic Claim Initiation | Creates claim records, monitors daily income for 5 consecutive loss days |
| Sub-module 3 - Instant Payout Processing | Calculates payout, sends via UPI, notifies worker, writes audit log |

---

## Sub-module 1 - Real-time Trigger Monitoring

We keep an eye on the weather, so you don’t have to. (Picture us as the “Oracle” from The Matrix-always watching for the next big event.) Here’s how we know when to act:

| API | Purpose |
|---|---|
| `warnings_district_api.php?id={obj_id}` | 5-day weather forecast per district |
| `nowcast_district_api.php?id={obj_id}` | Real-time current weather |

> **API Access:** Email `helpdesk[at]imd.gov.in` to whitelist your server IP. Free access.  
> **Fallback:** `weather.indianapi.in` as commercial backup - no IP whitelisting required.

### Alert Color Classification

| Color | Severity | Platform Action |
|---|---|---|
| 🔴 Red | Severe - cyclone, extremely heavy rain | Trigger fires for **all zones (A, B, C)** |
| 🟠 Orange | Significant - moderate-heavy rain | Trigger fires for **Zone A only** |
| 🟡 Yellow | Minor - light rain | No trigger - log only |
| 🟢 Green | No event | No action |

> **Yellow logging:** Three or more consecutive Yellow days in a zone → escalate for manual review.

**Deduplication:** One trigger per district per day maximum.

---

## Sub-module 2 - Automatic Claim Initiation

This is where the magic happens-claims are created for you, not by you!

### Phase 1 - Immediate *(runs once when trigger fires)*
- Fetch all workers in triggered zone with active policy and paid premium
- Create claim record per worker → status: `monitoring`, loss counter: `0`

### Phase 2 - Daily Income Check *(runs every midnight)*
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
| A - Disaster forced zero income | Active last 7 days | Zero earnings, zero logins | Eligible |
| B - Platform outage | Active last 7 days | Zero earnings, outage logged | Eligible |
| C - Voluntarily stopped | Active last 7 days | Zero earnings but logged in | Manual review |
| D - Already inactive | Not active 7 days prior | No activity | Rejected |

---

## Sub-module 3 - Instant Payout Processing

When it’s time to pay, we do it fast and transparently. (No “Game Over” screens here-just instant respawn for your wallet)

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

Here’s how a claim moves through the system:

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

Let’s walk through a typical disaster week:

```
Day 0 - Disaster hits
→ IMD issues Red/Orange alert
→ Poller detects within 15 minutes
→ Deduplication check passes
→ Claim records opened for all eligible workers (status: monitoring)

Day 1–4 - Daily midnight job runs
→ Earnings below 50% baseline → loss counter increments
→ Earnings above 50% → counter resets
→ Counter not yet at 5 - monitoring continues

Day 5 - Counter reaches 5
→ Claim status → payout_ready
→ Payout calculated (70% of weekly coverage)
→ UPI transfer dispatched
→ Worker notified via SMS and push
→ Audit log written
→ Claim status → closed
```

---

## Financial Sustainability Targets

We want InsureOn to be here for the long run, so we keep an eye on the numbers:

| Metric | Target |
|---|---|
| Loss Ratio | 55–65% |
| Expense Ratio | ~25% |
| Profit Margin | 10–15% |
| Reinsurance Partner | GIC Re / Munich Re |

---

## Tech Stack we aim to use

To build InsureOn, we plan to use the following tech stack which we have some experience with:

### Backend
- **Python (FastAPI)** - High-performance APIs and business logic
- **PyTorch** - Deep learning models for fraud detection and risk scoring
- **LibTorch** - C++ inference for production ML workloads (For high-performance/edge deployment)
- **Ray** - Distributed computing for scalable ML training and parallelized testing with RL algorithms implementation
- **PostgreSQL** - Reliable, scalable relational database
- **Redis** - Caching, real-time triggers, background jobs
- **Celery** - Distributed task queue for automation and scheduled jobs
- **Pandas, scikit-learn, XGBoost** - Data processing and classical ML
- **Farama Gymnasium** - For structuring simulation of RL is used

### Frontend
- **React (TypeScript)** - Modern, maintainable UI
- **Material-UI or Chakra UI** - Beautiful, accessible component library
- **Redux Toolkit or Zustand** - State management

### DevOps/Infra
- **Docker** - Containerization for all services
- **Kubernetes** (or Docker Compose for MVP) - Orchestration and scaling
- **GitHub Actions** - CI/CD pipelines
- **AWS/GCP/Azure** - Cloud hosting, managed PostgreSQL, S3 for file storage

### Integrations
- **IMD/NDMA APIs** - Weather and disaster alerts
- **UPI/Banking APIs** - Payouts
- **SMS/Push Notification APIs** - Alerts and communication

### Security/Compliance
- **OAuth2/JWT** - Secure authentication
- **Vault/Secrets Manager** - Managing sensitive keys

---

## 📄 License

This project is proprietary. All rights reserved.