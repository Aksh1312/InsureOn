import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { SmartworkActualsUpdate, SmartWorkTip } from '../api/types'

export function useSmartworkTip() {
  return useQuery<SmartWorkTip>({
    queryKey: QUERY_KEYS.smartworkTip,
    queryFn: api.getSmartworkTip,
    staleTime: 30 * 1000,
    refetchInterval: 60_000,
    retry: false,
  })
}

export function useUpdateSmartworkActuals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tipId, payload }: { tipId: number; payload: SmartworkActualsUpdate }) =>
      api.updateSmartworkActuals(tipId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.smartworkTip })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}
