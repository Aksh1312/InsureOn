# InsureOn — Parametric Automation Module

The operational core of the InsureOn platform. This module automatically detects weather disruptions, opens claims for affected workers, monitors their income, and disburses payouts — with zero manual intervention from anyone.

---

## What This Module Does

When a natural disaster or severe weather event hits a city where workers are registered:

- The system detects the event automatically via IMD weather alerts
- It opens claim records for every eligible affected worker automatically
- It monitors each worker's daily income for up to 7 days
- If income stays below 50% of their normal earnings for 5 consecutive days, money is sent automatically

The worker never files a claim. The system handles everything. Target payout is within **48–72 hours** of the trigger event.

---

## How the Three Sub-modules Fit Together

| Sub-module | Role | Function |
|---|---|---|
| Sub-module 1 — Real-time Trigger Monitoring | Detects the disaster | Calls IMD APIs every 15 minutes, classifies alert level, matches to worker zones |
| Sub-module 2 — Automatic Claim Initiation | Opens and monitors claims | Creates claim records, checks daily income against baseline for 5 consecutive days |
| Sub-module 3 — Instant Payout Processing | Disburses the payout | Calculates amount, sends via UPI, notifies worker, writes audit log |

---

## Sub-module 1 — Real-time Trigger Monitoring

A background service runs on the server every **15 minutes**. It calls two IMD APIs for every district where workers are registered, classifies the alert level, and fires a trigger if the threshold is met.

### IMD APIs Used

| API | Endpoint | Purpose |
|---|---|---|
| District Warnings | `warnings_district_api.php?id={obj_id}` | 5-day weather forecast per district |
| District Nowcast | `nowcast_district_api.php?id={obj_id}` | Real-time weather happening right now |

Both APIs are called together. Nowcast catches events already in progress. Warnings provide advance notice so workers can be pre-alerted the evening before a predicted Red or Orange day.

> **API Access:** IMD requires IP whitelisting. Email `helpdesk[at]imd.gov.in` with your server's public IP. Access is free.
> **Fallback:** Register with `weather.indianapi.in` as a commercial backup for IMD downtime. No IP whitelisting required.

---

### Alert Color Classification

Every IMD API response includes a `color` field. This is the single most important value in the trigger system.

| Color | Code | Weather Severity | Platform Action |
|---|---|---|---|
| 🔴 Red | 1 | Severe — cyclone, extremely heavy rain, violent storm | Trigger fires for **all zones (A, B, C)** |
| 🟠 Orange | 2 | Significant — moderate-heavy rain, thunderstorm | Trigger fires for **Zone A only** |
| 🟡 Yellow | 3 | Minor — light rain, low lightning probability | No trigger — log event only |
| 🟢 Green | 4 | No weather event | No action |

> **Why Orange only triggers Zone A:** An Orange alert in Chennai (Zone A, coastal) can flood streets and ground all delivery workers. The same Orange alert in Delhi (Zone C, inland) may produce light rain with no operational impact. Orange is zone-selective. Red is universal.

> **Yellow logging:** Yellow alerts never trigger a claim but are always logged. Three or more consecutive Yellow days in a zone should be escalated for manual review.

---

### District obj_id Mapping

IMD identifies each district by a numeric ID. The platform maintains a lookup table mapping registered cities to their IMD district IDs:

| City | Zone | IMD obj_id |
|---|---|---|
| Chennai | A | 573 |
| Mumbai | A | 312 |
| Kolkata | A | 489 |
| Bengaluru | B | 201 |
| Hyderabad | B | 198 |
| Ahmedabad | B | 142 |
| Delhi | C | 164 |
| Pune | C | 387 |

New cities are added to this table as the platform expands.

---

### Deduplication

Since the poller runs every 15 minutes, a single storm lasting 6 hours would generate 24 triggers for the same district without deduplication. The system checks before firing: has this district already been triggered today? If yes, it skips. One trigger record per district per day maximum.

---

## Sub-module 2 — Automatic Claim Initiation

Once a trigger fires, this sub-module runs in two phases: an immediate phase that opens claim records, and an ongoing daily phase that monitors income until the 5-day threshold is reached.

### Phase 1 — Immediate *(runs once when trigger fires)*

- Fetch all workers in the triggered zone with an **active policy** and **paid-up premium**
- Create a claim record per worker with status set to `monitoring` and loss counter at `0`

### Phase 2 — Daily Income Check *(runs every midnight)*

- Pull today's earnings from the platform API (Swiggy, Zomato, Blinkit, Dunzo)
- Compare against the worker's personal **baseline daily income**
- If earnings fall below **50% of baseline** → loss counter increments by one
- If earnings recover to or above 50% → counter resets to zero
- When counter reaches **5** → claim status moves to `payout_ready`

---

### Baseline Income Calculation

```
Baseline Daily Income = Total Earnings (last 4 weeks) ÷ Working Days
```

**Example:** A worker earned ₹24,000 over 24 working days in the past 4 weeks → baseline = ₹1,000/day. The claim counter increments any day they earn below ₹500.

> **Why 4 weeks:** A single unusual week (festival rush or sick day) would distort the number. Four weeks smooths out variation and gives an accurate picture of normal earnings.

> **Why the counter resets on recovery:** If a worker voluntarily takes a day off during a disaster period, that day should not count toward the qualifying window. Only genuine consecutive loss days advance the claim.

> **Why 50% and not zero:** Delivery workers often still manage some earnings during disruptions — just far below normal. Zero as a threshold would miss genuine partial-loss cases.

---

### Payout Scale

| Days of Consecutive Loss | Payout |
|---|---|
| 1 to 4 days | No payout — below qualifying threshold |
| 5 days | 70% of weekly coverage amount |
| 6 days | 85% of weekly coverage amount |
| 7 days | 100% of weekly coverage amount |

---

### Worker Inactivity During the Event

When a worker shows zero platform activity during a disaster, the system determines why before deciding the claim outcome.

| Scenario | Pre-event Activity | During Event | Outcome |
|---|---|---|---|
| A — Disaster forced zero income | Active in last 7 days | Zero earnings, zero logins | Eligible — income counted as ₹0 |
| B — Forced off platform entirely | Active in last 7 days | Zero earnings, zero logins, platform outage logged | Eligible — income counted as ₹0 |
| C — Voluntarily stopped working | Active in last 7 days | Zero earnings but did log into app | Manual review |
| D — Already inactive before event | Not active in 7 days prior | No activity | Rejected — no causal link |

> **Key distinction between B and C:** Both show zero earnings. The difference is login data. No logins and no earnings = disaster prevented them from working (eligible). Logins present with no earnings = chose not to work (manual review).

> **Pre-event window:** Default lookback is 7 days. Extend to 14 days for workers with irregular schedules.

---

## Sub-module 3 — Instant Payout Processing

Once a claim reaches `payout_ready`, the system calculates the payout, sends the money, notifies the worker, and closes the claim — all simultaneously.

### Payout Calculation

| Days Lost | Calculation | Example (₹10,000 coverage) |
|---|---|---|
| 5 days | 70% of weekly coverage | ₹7,000 |
| 6 days | 85% of weekly coverage | ₹8,500 |
| 7 days | 100% of weekly coverage | ₹10,000 |

### Disbursement

- **Primary:** UPI transfer to the worker's registered UPI ID
- **Fallback:** Direct bank transfer if UPI is unavailable

> **Why UPI:** Instant, works 24/7, no bank branch involvement, primary payment method for gig workers in India.

### Worker Notification

At the moment of payment dispatch, the worker receives:
- SMS with payout amount and transaction ID
- Push notification via the platform app

### Audit Log

Every payout creates a permanent record containing:

| Field | Purpose |
|---|---|
| Trigger date | When the disaster was detected |
| Alert level | Red or Orange — what caused the trigger |
| Days of income lost | What drove the payout amount |
| Payout amount | Exact amount disbursed |
| Transaction ID | UPI or bank reference |
| Timestamp | When payment was sent |

> **Why the audit log matters:** Reinsurers (GIC Re, Munich Re) require clean payout records to calculate loss ratios. It is also the definitive record for dispute resolution and feeds historical data back into the fraud detection model.

---

## Claim Status Flow

```
monitoring
    │
    ├──► payout_ready ──► closed
    │
    ├──► manual_review    (Scenario C inactivity or fraud flag)
    │
    └──► rejected         (Scenario D inactivity or fraud detection)
```

---

## End-to-End Flow

**Day 0 — Disaster hits**
- IMD issues Red or Orange alert for district
- Poller detects qualifying color code within 15 minutes
- Deduplication check passes — trigger record created
- Claim records opened for all eligible workers in zone *(status: monitoring)*

**Day 1 to Day 4 — Daily midnight job runs**
- Platform API returns today's earnings per worker
- Earnings below 50% of baseline → loss counter increments
- Earnings above 50% → counter resets
- Counter has not reached 5 — monitoring continues

**Day 5 — Counter reaches 5**
- Claim status → `payout_ready`
- Payout calculated — 70% of weekly coverage
- UPI transfer dispatched
- Worker notified via SMS and push
- Audit log written
- Claim status → `closed`

---

## Implementation Checklist

### Access and Setup
- Email `helpdesk[at]imd.gov.in` to whitelist server IP for IMD API access
- Register with `weather.indianapi.in` for commercial fallback API key
- Build district `obj_id` lookup table for all registered worker cities
- Set up UPI payment gateway *(Razorpay or PayU recommended)*

### Sub-module 1 — Trigger Monitoring
- Build 15-minute IMD poller background service
- Implement deduplication — one trigger per district per day maximum
- Apply Orange → Zone A only logic
- Configure automatic fallback to commercial weather API on IMD failure
- Log Yellow alerts separately for manual escalation review

### Sub-module 2 — Claim Initiation
- Build claim creation function with eligibility check *(active policy + paid premium)*
- Set up daily midnight income check job
- Implement 5-day consecutive loss counter with reset-on-recovery
- Handle all four worker inactivity scenarios *(A, B, C, D)*
- Build manual review queue for Scenario C cases

### Sub-module 3 — Payout Processing
- Build payout calculator using 70 / 85 / 100% scale
- Integrate UPI gateway with bank transfer fallback
- Build SMS and push notification on payout confirmation
- Write audit log entry on every payout
- Test full end-to-end pipeline in staging with mock IMD data

### Monitoring and Operations
- Alert team if IMD poller fails two or more consecutive runs
- Build operations dashboard — active triggers, claims in monitoring, payouts pending
- Schedule weekly automated loss ratio report per zone for reinsurer

---

*Part of the InsureOn platform documentation. See the main README for zone classification, tier structure, premium pricing, worker personas and risk modelling.*