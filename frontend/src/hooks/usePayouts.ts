import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { Payout } from '../api/types'

export function usePayoutHistory() {
  return useQuery<Payout[]>({
    queryKey: QUERY_KEYS.payoutHistory,
    queryFn: api.getPayoutHistory,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function usePayoutForClaim(claimId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.payoutForClaim(claimId ?? 0),
    queryFn: () => api.getPayoutForClaim(claimId!),
    enabled: !!claimId,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}
