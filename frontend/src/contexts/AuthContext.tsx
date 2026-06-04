import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import * as api from '../api'
import type { SignupPayload, UserOut } from '../api/types'
import { useAppStore } from '../lib/store'
import { queryClient } from '../lib/query'

const TOKEN_KEY = 'insureon_token'

type AuthContextValue = {
  token: string | null
  user: UserOut | null
  isLoading: boolean
  isReady: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserOut | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const storeToken = useCallback((value: string | null) => {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setToken(value)
  }, [])

  const refresh = useCallback(async () => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) {
      setUser(null)
      setInitialized(true)
      setIsLoading(false)
      return
    }
    try {
      const me = await api.getMe()
      setUser(me)
    } catch {
      storeToken(null)
      setUser(null)
    } finally {
      setInitialized(true)
      setIsLoading(false)
    }
  }, [token, storeToken])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password)
    storeToken(response.access_token)
    setUser(null)
    setIsLoading(true)
    queryClient.clear()
    useAppStore.getState().clearNotifications()
    await refresh()
  }, [storeToken, refresh])

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await api.signup(payload)
    storeToken(response.access_token)
    setUser(null)
    setIsLoading(true)
    queryClient.clear()
    useAppStore.getState().clearNotifications()
    await refresh()
  }, [storeToken, refresh])

  const logout = useCallback(() => {
    storeToken(null)
    setUser(null)
    queryClient.clear()
    useAppStore.getState().clearNotifications()
  }, [storeToken])

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isReady: initialized,
      isAuthenticated: !!token && !!user,
      login,
      signup,
      logout,
      refresh,
    }),
    [token, user, isLoading, initialized, login, signup, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
