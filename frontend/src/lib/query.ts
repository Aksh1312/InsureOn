import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export const QUERY_KEYS = {
  me: ['me'],
  dashboard: ['dashboard'],
  profile: ['profile'],
  riskScore: ['riskScore'],
  riskHistory: ['riskHistory'],
  activePolicy: ['activePolicy'],
  policyHistory: ['policyHistory'],
  activeClaim: ['activeClaim'],
  claimHistory: ['claimHistory'],
  claim: (claimId: number) => ['claim', claimId],
  incomeLogs: (claimId: number) => ['incomeLogs', claimId],
  fraudSignal: (claimId: number) => ['fraudSignal', claimId],
  payoutHistory: ['payoutHistory'],
  payoutForClaim: (claimId: number) => ['payout', claimId],
  smartworkTip: ['smartworkTip'],
  onboardingOptions: ['onboardingOptions'],
  imdTriggers: ['imdTriggers'],
  broadcastHistory: ['broadcastHistory'],
  adminDashboard: ['adminDashboard'],
  adminWorkers: ['adminWorkers'],
  adminClaims: ['adminClaims'],
  adminClaimsTrend: ['adminClaimsTrend'],
  adminRiskDistribution: ['adminRiskDistribution'],
  weatherAdvisory: (city: string) => ['weatherAdvisory', city],
  renewalPreview: ['renewalPreview'],
  walletTransactions: ['walletTransactions'],
}

export function invalidateMany(keys: string[][]) {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key })
  })
}
