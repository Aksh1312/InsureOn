import { useQuery } from '@tanstack/react-query'
import * as api from '../api'
import { QUERY_KEYS } from '../lib/query'
import type { TransactionItem } from '../api/types'

export function useWalletTransactions(type?: string) {
  return useQuery<TransactionItem[]>({
    queryKey: [...QUERY_KEYS.walletTransactions, type].filter(Boolean),
    queryFn: () => api.getWalletTransactions(type),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
