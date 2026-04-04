import { apiFormRequest, apiRequest } from './client'
import type {
  Claim,
  DailyIncomeLog,
  DashboardSummary,
  FraudSignal,
  OnboardingOptions,
  Payout,
  Policy,
  RiskScore,
  SignupPayload,
  SmartWorkTip,
  SmartworkActualsUpdate,
  TokenResponse,
  UserOut,
  WorkerProfile,
  WorkerProfileUpdate,
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
