import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationItem = {
  id: string
  type: 'imd_alert' | 'claim_update' | 'payout' | 'policy' | 'smartwork' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

export type ActivityItem = {
  id: string
  type: 'claim' | 'payout' | 'policy' | 'alert' | 'fraud' | 'smartwork' | 'premium'
  title: string
  description: string
  timestamp: string
  relativeTime: string
  category: string
  categoryColor: string
}

export type OnboardingStep = 'welcome' | 'platform' | 'location' | 'income' | 'preview' | 'complete'

type AppStore = {
  onboardingComplete: boolean
  currentOnboardingStep: OnboardingStep
  notifications: NotificationItem[]
  activityFeed: ActivityItem[]
  unreadCount: number
  sidebarCollapsed: boolean
  setOnboardingComplete: (val: boolean) => void
  setOnboardingStep: (step: OnboardingStep) => void
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void
  addActivity: (item: Omit<ActivityItem, 'id' | 'timestamp' | 'relativeTime'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearNotifications: () => void
  clearActivity: () => void
  setSidebarCollapsed: (val: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      currentOnboardingStep: 'welcome',
      notifications: [],
      activityFeed: [],
      unreadCount: 0,
      sidebarCollapsed: false,

      setOnboardingComplete: (val) => set({ onboardingComplete: val }),
      setOnboardingStep: (step) => set({ currentOnboardingStep: step }),

      addNotification: (n) =>
        set((state) => {
          const item: NotificationItem = {
            ...n,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            read: false,
          }
          return {
            notifications: [item, ...state.notifications].slice(0, 100),
            unreadCount: state.unreadCount + 1,
          }
        }),

      addActivity: (item) =>
        set((state) => {
          const now = new Date().toISOString()
          const entry: ActivityItem = {
            ...item,
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            relativeTime: 'just now',
          }
          const updated = [entry, ...state.activityFeed].slice(0, 100)
          const nowTs = Date.now()
          const withRelative = updated.map((a) => {
            const diff = nowTs - new Date(a.timestamp).getTime()
            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(diff / 3600000)
            const days = Math.floor(diff / 86400000)
            let relativeTime = 'just now'
            if (minutes >= 1 && minutes < 60) relativeTime = `${minutes}m ago`
            else if (hours >= 1 && hours < 24) relativeTime = `${hours}h ago`
            else if (days >= 1 && days < 7) relativeTime = `${days}d ago`
            else if (days >= 7 && days < 30) relativeTime = `${Math.floor(days / 7)}w ago`
            return { ...a, relativeTime }
          })
          return { activityFeed: withRelative }
        }),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
      clearActivity: () => set({ activityFeed: [] }),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
    }),
    {
      name: 'insureon-app-store',
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        currentOnboardingStep: state.currentOnboardingStep,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
