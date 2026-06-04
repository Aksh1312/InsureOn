import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import { useToast } from '@chakra-ui/react'
import type { RenewalPreview } from '../api/types'

export function useActivePolicy() {
  return useQuery({
    queryKey: QUERY_KEYS.activePolicy,
    queryFn: api.getActivePolicy,
    retry: false,
  })
}

export function usePolicyHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.policyHistory,
    queryFn: api.getPolicyHistory,
  })
}

export function useIssuePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.issueWeeklyPolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activePolicy })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.policyHistory })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}

export function usePayPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (policyId: number) => api.payPolicy(policyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activePolicy })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.policyHistory })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}

export function useRenewalPreview() {
  return useQuery<RenewalPreview>({
    queryKey: QUERY_KEYS.renewalPreview,
    queryFn: api.getRenewalPreview,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useDownloadPolicyCertificate() {
  const toast = useToast()
  return useMutation({
    mutationFn: (policyId: number) => api.downloadPolicyCertificate(policyId),
    onSuccess: () => {
      toast({ title: 'Certificate downloaded successfully', status: 'success', duration: 3000, isClosable: true })
    },
    onError: (err) => {
      toast({ title: 'Failed to generate certificate', description: err instanceof Error ? err.message : 'Please try again', status: 'error', duration: 4000, isClosable: true })
    },
  })
}
