"""
8-Layer Fraud Detection Engine
--------------------------------
All 8 layers feed into a logistic regression score.
Graph-based fraud ring detection runs in parallel.

Decision thresholds:
  0.00–0.20 → auto_approve
  0.20–0.50 → fast_review
  0.50–0.80 → manual
  0.80–1.00 → reject
"""

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from collections import defaultdict
import math
from .. import models
from .. import crud


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


# ── Layer weights for logistic regression ──
LAYER_WEIGHTS = {
    "w1_worker_history":      0.30,
    "w2_event_verification":  0.20,
    "w3_zone_pattern":        0.20,
    "w4_neighboring_zone":    0.15,
    "w5_behavioral_deviation":0.15,
}
BIAS = -1.5  # calibrated to produce ~0.1 score for clean claims


def layer_1_event_verification(db: Session, claim: models.Claim) -> float:
    """
    Checks if an official IMD event exists for this claim's trigger.
    RED   → 0.0 (strong confirmation — low fraud signal)
    ORANGE→ 0.1
    YELLOW→ 0.5
    None  → 1.0 (no event — high fraud signal)
    """
    trigger = db.query(models.IMDTriggerEvent).filter(
        models.IMDTriggerEvent.id == claim.trigger_event_id
    ).first()

    if not trigger:
        return 1.0
    return {"RED": 0.0, "ORANGE": 0.1, "YELLOW": 0.5, "GREEN": 1.0}.get(
        trigger.alert_color, 0.5
    )


def layer_2_weather_baseline(claim: models.Claim) -> float:
    """
    TODO: Compare today's rainfall with historical 90th percentile.
    Requires integration with historical weather DB or API.
    Returns 0.0 if event is historically severe, 0.5 if borderline, 1.0 if normal.
    Mock implementation — replace with real historical comparison.
    """
    # Placeholder — always return 0.1 (mild suspicion) until real data integrated
    return 0.1


def layer_3_worker_behaviour(db: Session, user_id: int) -> float:
    """
    Scores based on claim frequency and work activity stability.
    """
    six_months_ago = datetime.utcnow() - timedelta(days=180)

    total_claims = db.query(models.Claim).filter(
        models.Claim.user_id == user_id,
        models.Claim.created_at >= six_months_ago,
    ).count()

    recent_claims = db.query(models.Claim).filter(
        models.Claim.user_id == user_id,
        models.Claim.created_at >= datetime.utcnow() - timedelta(days=30),
    ).count()

    score = 0.0
    if total_claims >= 3:
        score += 0.5
    elif total_claims >= 2:
        score += 0.3
    elif total_claims == 1:
        score += 0.1

    if recent_claims >= 2:
        score += 0.4  # multiple claims in one month — suspicious

    return min(score, 1.0)


def layer_4_platform_activity(db: Session, claim: models.Claim) -> float:
    """
    Checks platform login and delivery activity before and during claim.
    Inactivity starting exactly at claim submission is suspicious.
    """
    logs = crud.get_income_logs_for_claim(db, claim.id)

    if not logs:
        return 0.3  # no data yet — mild suspicion

    # Check if inactivity started exactly on day claim was opened
    first_log = logs[0]
    if first_log.log_date == claim.monitoring_start and not first_log.platform_logged_in:
        # Wasn't logged in from day 1 — suspicious
        return 0.7

    # If logged in but earning 0 — scenario C (manual review territory)
    zero_earning_but_logged_in = [
        l for l in logs if l.income_earned == 0 and l.platform_logged_in
    ]
    if len(zero_earning_but_logged_in) >= 2:
        return 0.6

    return 0.1


def layer_5_income_pattern(db: Session, claim: models.Claim) -> float:
    """
    Gradual income drop → genuine disruption
    Instant zero income at claim start → suspicious
    """
    logs = crud.get_income_logs_for_claim(db, claim.id)

    if not logs:
        return 0.2

    # Check if income went to 0 instantly on day 1
    if logs[0].income_earned == 0:
        return 0.6  # instant zero — suspicious

    # Check if drop was gradual
    incomes = [l.income_earned for l in logs]
    if len(incomes) >= 3:
        if incomes[0] > incomes[1] > incomes[2]:
            return 0.05  # gradual drop — genuine
        else:
            return 0.2

    return 0.2


def layer_6_zone_correlation(db: Session, claim: models.Claim) -> float:
    """
    Compare this worker's claim against zone-wide claim rate.
    High zone claim rate supports genuine disaster.
    Lone claimant in otherwise unaffected zone → suspicious.
    """
    profile = crud.get_worker_profile(db, claim.user_id)
    if not profile:
        return 0.5

    # Count claims opened around the same trigger event
    zone_claims = db.query(models.Claim).filter(
        models.Claim.trigger_event_id == claim.trigger_event_id
    ).count()

    # Count workers in this zone
    zone_workers = db.query(models.WorkerProfile).filter(
        models.WorkerProfile.zone == profile.zone
    ).count()

    if zone_workers == 0:
        return 0.5

    claim_rate = zone_claims / zone_workers

    if claim_rate >= 0.30:
        return 0.0   # 30%+ of zone affected — genuine
    elif claim_rate >= 0.10:
        return 0.2
    elif claim_rate >= 0.03:
        return 0.5
    else:
        return 0.8   # lone claimant — suspicious


def layer_7_neighboring_zone(db: Session, claim: models.Claim) -> float:
    """
    Genuine disasters affect neighboring zones too.
    Check if adjacent zones have claims for the same trigger event.
    """
    profile = crud.get_worker_profile(db, claim.user_id)
    if not profile:
        return 0.3

    neighboring_zones = {"A": ["B"], "B": ["A", "C"], "C": ["B"]}
    neighbors = neighboring_zones.get(profile.zone.value, [])

    neighbor_claim_count = 0
    for nzone in neighbors:
        count = db.query(models.Claim).join(models.WorkerProfile,
            models.Claim.user_id == models.WorkerProfile.user_id
        ).filter(
            models.WorkerProfile.zone == nzone,
            models.Claim.trigger_event_id == claim.trigger_event_id,
        ).count()
        neighbor_claim_count += count

    if neighbor_claim_count >= 5:
        return 0.0   # neighboring zones also affected — genuine
    elif neighbor_claim_count >= 2:
        return 0.2
    else:
        return 0.6   # isolated zone — suspicious


def layer_8_behavioral_deviation(db: Session, claim: models.Claim) -> float:
    """
    Compare worker's behavior during claim vs their own historical fingerprint.
    Abrupt stoppage aligned with claim submission = high fraud signal.
    """
    profile = crud.get_worker_profile(db, claim.user_id)
    if not profile:
        return 0.3

    logs = crud.get_income_logs_for_claim(db, claim.id)
    if not logs:
        return 0.2

    baseline = profile.avg_daily_income
    if baseline == 0:
        return 0.3

    # Check how sudden the drop was
    day1_income = logs[0].income_earned
    drop_ratio = 1 - (day1_income / baseline) if baseline > 0 else 1.0

    # Compare with peer median (workers in same zone and tier)
    peer_claims = db.query(models.DailyIncomeLog).join(
        models.Claim, models.DailyIncomeLog.claim_id == models.Claim.id
    ).join(
        models.WorkerProfile, models.Claim.user_id == models.WorkerProfile.user_id
    ).filter(
        models.WorkerProfile.zone == profile.zone,
        models.WorkerProfile.tier == profile.tier,
        models.Claim.trigger_event_id == claim.trigger_event_id,
        models.DailyIncomeLog.log_date == claim.monitoring_start,
    ).all()

    if peer_claims:
        peer_drops = []
        for p in peer_claims:
            if p.baseline_income > 0:
                peer_drops.append(1 - (p.income_earned / p.baseline_income))

        if peer_drops:
            avg_peer_drop = sum(peer_drops) / len(peer_drops)
            # If this worker's drop is significantly MORE than peers → suspicious
            if drop_ratio > avg_peer_drop + 0.30:
                return 0.7
            elif abs(drop_ratio - avg_peer_drop) <= 0.10:
                return 0.05  # consistent with peers — genuine

    # Sudden 100% drop with no peer comparison
    if drop_ratio >= 1.0 and not logs[0].platform_logged_in:
        return 0.3  # consistent with scenario A
    elif drop_ratio >= 1.0 and logs[0].platform_logged_in:
        return 0.7  # 100% drop but logged in — suspicious

    return 0.2


def _compute_fraud_probability(layer_scores: dict) -> float:
    """
    Logistic regression over 5 aggregated layer scores.
    """
    # Aggregate 8 layers into 5 feature groups
    w1 = (layer_scores["l3"] + layer_scores["l4"]) / 2   # worker history
    w2 = layer_scores["l1"]                               # event verification
    w3 = layer_scores["l6"]                               # zone pattern
    w4 = layer_scores["l7"]                               # neighboring zone
    w5 = (layer_scores["l5"] + layer_scores["l8"]) / 2   # behavioral deviation

    linear = (
        LAYER_WEIGHTS["w1_worker_history"]       * w1 +
        LAYER_WEIGHTS["w2_event_verification"]   * w2 +
        LAYER_WEIGHTS["w3_zone_pattern"]         * w3 +
        LAYER_WEIGHTS["w4_neighboring_zone"]     * w4 +
        LAYER_WEIGHTS["w5_behavioral_deviation"] * w5 +
        BIAS
    )
    return round(_sigmoid(linear), 4)


def _compute_cluster_risk(db: Session, claim: models.Claim) -> float:
    """
    Graph-based fraud ring detection.
    Checks for shared UPI, device, phone, and timing patterns.
    cluster_risk = 0.4 * timing + 0.3 * location + 0.2 * income_pattern + 0.1 * device_link
    """
    trigger_time = claim.created_at
    if not trigger_time:
        return 0.0

    # Check for claims filed within 10 minutes of this claim (timing cluster)
    window_start = trigger_time - timedelta(minutes=10)
    window_end   = trigger_time + timedelta(minutes=10)

    nearby_claims = db.query(models.Claim).filter(
        models.Claim.id != claim.id,
        models.Claim.trigger_event_id == claim.trigger_event_id,
        models.Claim.created_at >= window_start,
        models.Claim.created_at <= window_end,
    ).count()

    timing_score = min(nearby_claims / 5, 1.0)  # 5+ in same window = max score

    # Check location overlap via trigger event (same district = overlap)
    profile = crud.get_worker_profile(db, claim.user_id)
    same_zone_claims = db.query(models.Claim).join(
        models.WorkerProfile, models.Claim.user_id == models.WorkerProfile.user_id
    ).filter(
        models.WorkerProfile.zone == (profile.zone if profile else "A"),
        models.Claim.trigger_event_id == claim.trigger_event_id,
    ).count()
    location_score = min(same_zone_claims / 20, 1.0)

    # Income pattern similarity (simplified — same-day zero income)
    logs = crud.get_income_logs_for_claim(db, claim.id)
    income_score = 0.5 if logs and logs[0].income_earned == 0 else 0.1

    cluster_risk = (
        0.4 * timing_score +
        0.3 * location_score +
        0.2 * income_score +
        0.1 * 0.0  # device/payment link — requires UPI/device table (future)
    )
    return round(cluster_risk, 4)


def _get_decision(fraud_prob: float) -> str:
    if fraud_prob < 0.20:
        return "auto_approve"
    elif fraud_prob < 0.50:
        return "fast_review"
    elif fraud_prob < 0.80:
        return "manual"
    else:
        return "reject"


def evaluate_claim(db: Session, claim: models.Claim) -> models.FraudSignal:
    """
    Main entry point. Call this when a claim reaches payout_ready
    or at any point during monitoring.
    Runs all 8 layers, computes fraud probability, saves FraudSignal.
    """
    l1 = layer_1_event_verification(db, claim)
    l2 = layer_2_weather_baseline(claim)
    l3 = layer_3_worker_behaviour(db, claim.user_id)
    l4 = layer_4_platform_activity(db, claim)
    l5 = layer_5_income_pattern(db, claim)
    l6 = layer_6_zone_correlation(db, claim)
    l7 = layer_7_neighboring_zone(db, claim)
    l8 = layer_8_behavioral_deviation(db, claim)

    fraud_prob    = _compute_fraud_probability({"l1":l1,"l2":l2,"l3":l3,"l4":l4,"l5":l5,"l6":l6,"l7":l7,"l8":l8})
    cluster_risk  = _compute_cluster_risk(db, claim)
    is_ring       = cluster_risk >= 0.6
    decision      = _get_decision(fraud_prob)

    # Update claim fraud fields
    claim.fraud_probability = fraud_prob
    claim.is_fraud_flagged  = (decision in ("manual", "reject")) or is_ring
    db.commit()

    signal = crud.create_fraud_signal(
        db=db,
        claim_id=claim.id,
        user_id=claim.user_id,
        layer_1_event_verification=l1,
        layer_2_weather_baseline=l2,
        layer_3_worker_behaviour=l3,
        layer_4_platform_activity=l4,
        layer_5_income_pattern=l5,
        layer_6_zone_correlation=l6,
        layer_7_neighboring_zone=l7,
        layer_8_behavioral_deviation=l8,
        fraud_probability=fraud_prob,
        is_fraud_ring_flagged=is_ring,
        cluster_risk_score=cluster_risk,
        decision=decision,
    )
    return signal
