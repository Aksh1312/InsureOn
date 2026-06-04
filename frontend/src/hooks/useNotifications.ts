import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../api'
import { QUERY_KEYS } from '../lib/query'

const CLAIM_NOTIFICATION_TYPES = ['CLAIM_APPROVED', 'CLAIM_REJECTED', 'PAYOUT_SENT', 'CLAIM_OPENED']

export function useNotifications() {
  const queryClient = useQueryClient()
  const prevIdsRef = useRef<Set<number>>(new Set())

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const notifications = query.data
    if (!notifications) return

    const currentIds = new Set(notifications.map(n => n.id))
    const prevIds = prevIdsRef.current

    // Skip invalidation on first load to avoid unnecessary refetches
    if (prevIds.size === 0) {
      prevIdsRef.current = currentIds
      return
    }

    const hasNewClaimNotif = notifications.some(
      n => !prevIds.has(n.id) && CLAIM_NOTIFICATION_TYPES.includes(n.type)
    )

    if (hasNewClaimNotif) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeClaim })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.claimHistory })
    }

    prevIdsRef.current = currentIds
  }, [query.data, queryClient])

  return query
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}
