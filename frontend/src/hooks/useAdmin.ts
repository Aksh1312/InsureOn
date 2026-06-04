import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { AdminDashboard, UserOut, Claim, ClaimsTrend, RiskDistribution, IMDTrigger, BroadcastHistoryItem } from '../api/types'

export function useAdminDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: QUERY_KEYS.adminDashboard,
    queryFn: api.getAdminDashboard,
    staleTime: 5 * 1000,
    refetchInterval: 10_000,
  })
}

export function useAdminWorkers() {
  return useQuery<UserOut[]>({
    queryKey: QUERY_KEYS.adminWorkers,
    queryFn: api.getAdminWorkers,
    staleTime: 30 * 1000,
    refetchInterval: 60_000,
  })
}

export function useAdminClaims(userId?: number, isFraudFlagged?: boolean) {
  return useQuery<Claim[]>({
    queryKey: [...QUERY_KEYS.adminClaims, userId, isFraudFlagged],
    queryFn: () => api.getAdminClaims(userId, isFraudFlagged),
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}

export function useAdminClaimsTrend() {
  return useQuery<ClaimsTrend>({
    queryKey: QUERY_KEYS.adminClaimsTrend,
    queryFn: api.getAdminClaimsTrend,
    staleTime: 60 * 1000,
    refetchInterval: 120_000,
  })
}

export function useAdminRiskDistribution() {
  return useQuery<RiskDistribution>({
    queryKey: QUERY_KEYS.adminRiskDistribution,
    queryFn: api.getAdminRiskDistribution,
    staleTime: 60 * 1000,
    refetchInterval: 120_000,
  })
}

export function useIMDTriggers() {
  return useQuery<IMDTrigger[]>({
    queryKey: QUERY_KEYS.imdTriggers,
    queryFn: api.getIMDTriggers,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}

export function useBroadcastHistory() {
  return useQuery<BroadcastHistoryItem[]>({
    queryKey: QUERY_KEYS.broadcastHistory,
    queryFn: api.getBroadcastHistory,
    staleTime: 15 * 1000,
    refetchInterval: 30_000,
  })
}

export function useReviewClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, status }: { claimId: number; status: string }) =>
      api.reviewAdminClaim(claimId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminClaims, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard, refetchType: 'all' })
    },
  })
}

export function useSendAdminNotification() {
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: api.AdminSendNotificationPayload }) =>
      api.sendAdminNotification(userId, payload),
  })
}

export function useBroadcastAdminNotification() {
  return useMutation({
    mutationFn: (payload: api.AdminBroadcastNotificationPayload) =>
      api.broadcastAdminNotification(payload),
  })
}


