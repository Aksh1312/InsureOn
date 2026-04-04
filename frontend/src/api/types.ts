export type TokenResponse = {
  access_token: string
  token_type: string
}

export type OnboardingOptions = {
  platforms: string[]
  shifts: string[]
  zone_cities: Record<string, string[]>
  zone_rates: Record<string, number>
}

export type UserOut = {
  id: number
  full_name?: string | null
  email: string
  platform: string
  region: string
  income: number
  created_at: string
}

export type WorkerProfile = {
  id: number
  user_id: number
  zone: string
  tier: string
  pincode: string
  avg_weekly_hours: number
  avg_weekly_income: number
  avg_daily_income: number
  primary_shift: string
  is_multi_platform: boolean
  weekly_coverage: number
  weekly_premium: number
  last_updated: string
}

export type RiskScore = {
  id: number
  user_id: number
  week_start_date: string
  zone_score: number
  pincode_score: number
  hours_score: number
  shift_score: number
  claim_score: number
  total_score: number
  risk_category: string
  multiplier: number
  created_at: string
}

export type Policy = {
  id: number
  user_id: number
  week_start_date: string
  week_end_date: string
  zone: string
  tier: string
  weekly_coverage: number
  weekly_premium: number
  is_paid: boolean
  is_active: boolean
  created_at: string
}

export type Claim = {
  id: number
  user_id: number
  policy_id: number
  trigger_event_id: number
  status: string
  loss_counter: number
  monitoring_start: string
  monitoring_end?: string | null
  days_of_loss?: number | null
  payout_percentage?: number | null
  payout_amount?: number | null
  fraud_probability?: number | null
  is_fraud_flagged: boolean
  created_at: string
}

export type DailyIncomeLog = {
  id: number
  claim_id: number
  log_date: string
  income_earned: number
  baseline_income: number
  is_below_threshold: boolean
  platform_logged_in: boolean
}

export type Payout = {
  id: number
  claim_id: number
  user_id: number
  amount: number
  upi_id: string
  transaction_id?: string | null
  is_sent: boolean
  sent_at?: string | null
  trigger_date: string
  alert_level: string
  days_of_loss: number
  payout_percentage: number
  created_at: string
}

export type FraudSignal = {
  id: number
  claim_id: number
  layer_1_event_verification: number
  layer_2_weather_baseline: number
  layer_3_worker_behaviour: number
  layer_4_platform_activity: number
  layer_5_income_pattern: number
  layer_6_zone_correlation: number
  layer_7_neighboring_zone: number
  layer_8_behavioral_deviation: number
  fraud_probability: number
  is_fraud_ring_flagged: boolean
  cluster_risk_score?: number | null
  decision: string
  evaluated_at: string
}

export type SmartWorkTip = {
  id: number
  user_id: number
  week_start_date: string
  best_time_slots?: string | null
  best_zones?: string | null
  weather_window?: string | null
  surge_alerts?: string | null
  risk_advisory?: string | null
  projected_earnings?: number | null
  actual_earnings?: number | null
  followed_safety_tips?: boolean | null
}

export type PremiumBreakdown = {
  zone: string
  tier: string
  avg_weekly_hours: number
  avg_weekly_income: number
  weekly_coverage: number
  base_premium: number
  risk_multiplier: number
  weekly_premium: number
  applied_loadings: string[]
  applied_discounts: string[]
}

export type DashboardSummary = {
  user: UserOut
  profile?: WorkerProfile | null
  risk_score?: RiskScore | null
  smartwork_tip?: SmartWorkTip | null
  active_policy?: Policy | null
  policy_history: Policy[]
  active_claim?: Claim | null
  claim_history: Claim[]
  income_logs: DailyIncomeLog[]
  payout_history: Payout[]
  premium_breakdown?: PremiumBreakdown | null
}

export type SignupPayload = {
  full_name?: string
  email: string
  password: string
  platform: string
  region: string
  income: number
  pincode: string
  upi_id: string
  avg_weekly_hours?: number
  primary_shift?: string
  is_multi_platform?: boolean
}

export type WorkerProfileUpdate = {
  avg_weekly_hours?: number
  avg_weekly_income?: number
  primary_shift?: string
  is_multi_platform?: boolean
}

export type SmartworkActualsUpdate = {
  actual_earnings: number
  followed_safety_tips: boolean
}
