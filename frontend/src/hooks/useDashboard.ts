import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { DashboardSummary } from '../api/types'

export function useDashboard() {
  return useQuery<DashboardSummary>({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: api.getDashboardSummary,
    staleTime: 10 * 1000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}
