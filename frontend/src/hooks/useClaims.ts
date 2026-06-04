import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'

export function useActiveClaim() {
  return useQuery({
    queryKey: QUERY_KEYS.activeClaim,
    queryFn: api.getActiveClaim,
    retry: false,
    staleTime: 10 * 1000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  })
}

export function useClaimHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.claimHistory,
    queryFn: api.getClaimHistory,
    staleTime: 10 * 1000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useClaim(claimId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.claim(claimId ?? 0),
    queryFn: () => api.getClaim(claimId!),
    enabled: !!claimId,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}

export function useIncomeLogs(claimId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeLogs(claimId ?? 0),
    queryFn: () => api.getIncomeLogs(claimId!),
    enabled: !!claimId,
    staleTime: 30 * 1000,
    refetchInterval: 60_000,
  })
}

export function useFraudSignal(claimId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.fraudSignal(claimId ?? 0),
    queryFn: () => api.getFraudSignal(claimId!),
    enabled: !!claimId,
    retry: false,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}

export function useFileClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.fileClaim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.claimHistory })
    },
  })
}
