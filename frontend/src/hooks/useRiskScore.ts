import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { RiskScore } from '../api/types'

export function useRiskScoreHistory() {
  return useQuery<RiskScore[]>({
    queryKey: QUERY_KEYS.riskHistory,
    queryFn: api.getRiskHistory,
    staleTime: 60 * 1000,
  })
}
