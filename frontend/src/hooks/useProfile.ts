import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { WorkerProfileUpdate } from '../api/types'

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: api.getWorkerProfile,
    retry: false,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: WorkerProfileUpdate) => api.updateWorkerProfile(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.profile })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}
