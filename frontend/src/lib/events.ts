import { useAppStore, type NotificationItem, type ActivityItem } from './store'

type EventCallback = (data: any) => void

class EventService {
  private listeners = new Map<string, Set<EventCallback>>()
  private pollingTimers = new Map<string, ReturnType<typeof setInterval>>()

  on(event: string, cb: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(cb)
    return () => this.listeners.get(event)?.delete(cb)
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  startPolling(key: string, fn: () => Promise<void>, intervalMs: number) {
    this.stopPolling(key)
    fn()
    const timer = setInterval(fn, intervalMs)
    this.pollingTimers.set(key, timer)
  }

  stopPolling(key: string) {
    const timer = this.pollingTimers.get(key)
    if (timer) {
      clearInterval(timer)
      this.pollingTimers.delete(key)
    }
  }

  stopAll() {
    this.pollingTimers.forEach((timer) => clearInterval(timer))
    this.pollingTimers.clear()
  }
}

export const eventService = new EventService()

export function notifyActivity(type: NotificationItem['type'], title: string, message: string, severity?: NotificationItem['severity']) {
  const store = useAppStore.getState()
  store.addNotification({ type, title, message, severity })
  eventService.emit('notification', { type, title, message })
}

export function trackActivity(item: Omit<ActivityItem, 'id' | 'timestamp' | 'relativeTime'>) {
  const store = useAppStore.getState()
  store.addActivity(item)
  eventService.emit('activity', item)
}

const CATEGORY_MAP: Record<string, { color: string; label: string }> = {
  claim_opened: { color: 'blue', label: 'Claim' },
  claim_rejected: { color: 'red', label: 'Claim' },
  payout_processed: { color: 'teal', label: 'Payout' },
  smartwork_generated: { color: 'purple', label: 'SmartWork' },
  policy_activated: { color: 'green', label: 'Policy' },
  premium_paid: { color: 'brand', label: 'Premium' },
  imd_trigger_detected: { color: 'orange', label: 'Alert' },
  fraud_review_completed: { color: 'pink', label: 'Fraud' },
}

const TYPE_TO_ACTIVITY_TYPE: Record<string, ActivityItem['type']> = {
  claim_opened: 'claim',
  claim_rejected: 'claim',
  payout_processed: 'payout',
  smartwork_generated: 'smartwork',
  policy_activated: 'policy',
  premium_paid: 'premium',
  imd_trigger_detected: 'alert',
  fraud_review_completed: 'fraud',
}

export function trackNotificationAsActivity(type: NotificationItem['type'], title: string, message: string) {
  const catKey = type === 'claim_update' ? 'claim_opened'
    : type === 'payout' ? 'payout_processed'
    : type === 'policy' ? 'policy_activated'
    : type === 'smartwork' ? 'smartwork_generated'
    : type === 'imd_alert' ? 'imd_trigger_detected'
    : type === 'system' ? 'claim_opened'
    : 'claim_opened'
  const meta = CATEGORY_MAP[catKey] || { color: 'gray', label: 'Update' }
  trackActivity({
    type: TYPE_TO_ACTIVITY_TYPE[catKey] || 'claim',
    title,
    description: message,
    category: meta.label,
    categoryColor: meta.color,
  })
}
