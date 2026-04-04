import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../api'
import type { SignupPayload, UserOut } from '../api/types'

const TOKEN_KEY = 'insureon_token'

type AuthContextValue = {
  token: string | null
  user: UserOut | null
  isLoading: boolean
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

  const storeToken = (value: string | null) => {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setToken(value)
  }

  const refresh = async () => {
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await api.getMe()
      setUser(me)
    } catch {
      storeToken(null)
      setUser(null)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password)
    storeToken(response.access_token)
    await refresh()
  }

  const signup = async (payload: SignupPayload) => {
    const response = await api.signup(payload)
    storeToken(response.access_token)
    await refresh()
  }

  const logout = () => {
    storeToken(null)
    setUser(null)
  }

  useEffect(() => {
    const boot = async () => {
      setIsLoading(true)
      await refresh()
      setIsLoading(false)
    }
    boot()
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isLoading, login, signup, logout, refresh }),
    [token, user, isLoading]
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
