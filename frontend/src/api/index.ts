import { apiFormRequest, apiRequest, API_BASE_URL } from './client'
import type {
  CalculatorEstimateRequest,
  CalculatorEstimateResponse,
  Claim,
  DailyIncomeLog,
  DashboardSummary,
  FraudSignal,
  OnboardingOptions,
  Payout,
  Policy,
  RenewalPreview,
  RiskScore,
  SignupPayload,
  SmartWorkTip,
  SmartworkActualsUpdate,
  TokenResponse,
  UserOut,
  WorkerProfile,
  WorkerProfileUpdate,
  AdminDashboard,
  IMDTrigger,
  ClaimsTrend,
  RiskDistribution,
  NotificationItem,
  UnreadCount,
  WeatherAdvisory,
  TransactionItem,
  BroadcastHistoryItem,
} from './types'

export const login = (email: string, password: string) =>
  apiFormRequest<TokenResponse>('/login', {
    username: email,
    password,
  })

export const signup = (payload: SignupPayload) =>
  apiRequest<TokenResponse>('/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getMe = () => apiRequest<UserOut>('/me', { auth: true })

export const getOnboardingOptions = () =>
  apiRequest<OnboardingOptions>('/onboarding/options')

export const getDashboardSummary = () =>
  apiRequest<DashboardSummary>('/dashboard/summary', { auth: true })

export const getWorkerProfile = () =>
  apiRequest<WorkerProfile>('/workers/profile', { auth: true })

export const updateWorkerProfile = (payload: WorkerProfileUpdate) =>
  apiRequest<WorkerProfile>('/workers/profile', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })

export const getRiskScore = () =>
  apiRequest<RiskScore>('/workers/risk-score', { auth: true })

export const getRiskHistory = () =>
  apiRequest<RiskScore[]>('/workers/risk-score/history', { auth: true })

export const getSmartworkTip = () =>
  apiRequest<SmartWorkTip>('/workers/smartwork', { auth: true })

export const updateSmartworkActuals = (tipId: number, payload: SmartworkActualsUpdate) =>
  apiRequest<SmartWorkTip>(`/workers/smartwork/${tipId}/actuals`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })

export const issueWeeklyPolicy = () =>
  apiRequest<Policy>('/policies/issue', { method: 'POST', auth: true })

export const getActivePolicy = () =>
  apiRequest<Policy>('/policies/active', { auth: true })

export const getPolicyHistory = () =>
  apiRequest<Policy[]>('/policies/history', { auth: true })

export const payPolicy = (policyId: number) =>
  apiRequest<Policy>(`/policies/${policyId}/pay`, { method: 'POST', auth: true })

export const getRenewalPreview = () =>
  apiRequest<RenewalPreview>('/policies/renewal-preview', { auth: true })

export const downloadPolicyCertificate = async (policyId: number): Promise<void> => {
  const token = localStorage.getItem('insureon_token')
  const response = await fetch(`${API_BASE_URL}/policies/${policyId}/certificate`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    let message = response.statusText
    try {
      const payload = await response.json()
      message = payload.detail || payload.message || message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `InsureOn_Policy_${policyId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const fileClaim = () =>
  apiRequest<Claim>('/claims/file', { method: 'POST', auth: true })

export const getActiveClaim = () =>
  apiRequest<Claim>('/claims/active', { auth: true })

export const getClaimHistory = () =>
  apiRequest<Claim[]>('/claims/history', { auth: true })

export const getClaim = (claimId: number) =>
  apiRequest<Claim>(`/claims/${claimId}`, { auth: true })

export const getIncomeLogs = (claimId: number) =>
  apiRequest<DailyIncomeLog[]>(`/claims/${claimId}/income-logs`, { auth: true })

export const getFraudSignal = (claimId: number) =>
  apiRequest<FraudSignal>(`/claims/${claimId}/fraud-signal`, { auth: true })

export const getPayoutHistory = () =>
  apiRequest<Payout[]>('/payouts/history', { auth: true })

export const getPayoutForClaim = (claimId: number) =>
  apiRequest<Payout>(`/payouts/claim/${claimId}`, { auth: true })

export const getAdminDashboard = () =>
  apiRequest<AdminDashboard>('/admin/dashboard', { auth: true })

export const getAdminWorkers = () =>
  apiRequest<UserOut[]>('/admin/workers', { auth: true })

export const getAdminClaims = (userId?: number, isFraudFlagged?: boolean) => {
  const params = new URLSearchParams()
  if (userId !== undefined) params.append('user_id', String(userId))
  if (isFraudFlagged !== undefined) params.append('is_fraud_flagged', String(isFraudFlagged))
  const qs = params.toString()
  return apiRequest<Claim[]>(`/admin/claims${qs ? `?${qs}` : ''}`, { auth: true })
}

export const reviewAdminClaim = (claimId: number, status: string) =>
  apiRequest<Claim>(`/admin/claims/${claimId}/review`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ status }),
  })

export const getAdminClaimsTrend = () =>
  apiRequest<ClaimsTrend>('/admin/claims-trend', { auth: true })

export const getAdminRiskDistribution = () =>
  apiRequest<RiskDistribution>('/admin/risk-distribution', { auth: true })

export const getIMDTriggers = () =>
  apiRequest<IMDTrigger[]>('/admin/imd-triggers', { auth: true })

export const getBroadcastHistory = () =>
  apiRequest<BroadcastHistoryItem[]>('/admin/broadcast-history', { auth: true })

export type AdminCreateUserPayload = {
  email: string
  password: string
  full_name?: string
  platform?: string
  region?: string
  income?: number
  pincode?: string
  upi_id?: string
  avg_weekly_hours?: number
  primary_shift?: string
  is_multi_platform?: boolean
  is_admin?: boolean
}

export const adminCreateUser = (payload: AdminCreateUserPayload) =>
  apiRequest<UserOut>('/admin/users/create', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  })

export const estimateProtection = (payload: CalculatorEstimateRequest) =>
  apiRequest<CalculatorEstimateResponse>('/calculator/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getNotifications = (limit = 50, offset = 0) =>
  apiRequest<NotificationItem[]>(`/notifications?limit=${limit}&offset=${offset}`, { auth: true })

export const getUnreadCount = () =>
  apiRequest<UnreadCount>('/notifications/unread-count', { auth: true })

export const markNotificationRead = (id: number) =>
  apiRequest<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PUT', auth: true })

export const markAllNotificationsRead = () =>
  apiRequest<{ ok: boolean }>('/notifications/read-all', { method: 'PUT', auth: true })

export const getWeatherAdvisory = (city: string) =>
  apiRequest<WeatherAdvisory>(`/weather/advisory?city=${encodeURIComponent(city)}`, { auth: true })

export const getWalletTransactions = (type?: string) =>
  apiRequest<TransactionItem[]>(`/wallet/transactions${type ? `?transaction_type=${type}` : ''}`, { auth: true })

export const getSystemStats = () =>
  apiRequest<{
    total_users: number
    total_claims: number
    total_policies: number
    total_payouts: number
    db_size_bytes: number
    status: string
  }>('/admin/system-stats', { auth: true })

export const triggerRepricing = () =>
  apiRequest<{ status: string; message: string }>('/admin/reprice', {
    method: 'POST',
    auth: true,
  })

export const adminUpdateWorkerProfile = (userId: number, payload: WorkerProfileUpdate) =>
  apiRequest<WorkerProfile>(`/admin/workers/${userId}/profile`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })

export const getWorkerProfileById = (userId: number) =>
  apiRequest<WorkerProfile>(`/admin/workers/${userId}/profile`, { auth: true })

export const listAllPolicies = (userId?: number) =>
  apiRequest<Policy[]>(`/admin/policies${userId ? `?user_id=${userId}` : ''}`, { auth: true })

export type AdminSendNotificationPayload = {
  title: string
  message: string
  type: string
}

export const sendAdminNotification = (userId: number, payload: AdminSendNotificationPayload) =>
  apiRequest<{ status: string; message: string }>(`/admin/workers/${userId}/notifications`, {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  })

export type AdminBroadcastNotificationPayload = {
  region: string
  title: string
  message: string
  type: string
}

export const broadcastAdminNotification = (payload: AdminBroadcastNotificationPayload) =>
  apiRequest<{ status: string; message: string; sent_count: number }>('/admin/broadcast-notification', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  })

