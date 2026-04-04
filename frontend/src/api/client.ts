const DEFAULT_BASE = 'http://localhost:8000'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_BASE

export type ApiOptions = RequestInit & {
  auth?: boolean
}

const getToken = () => localStorage.getItem('insureon_token')

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth) {
    const token = getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    let message = response.statusText
    try {
      const payload = await response.json()
      message = payload.detail || payload.message || message
    } catch {
      message = response.statusText
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export async function apiFormRequest<T>(path: string, form: Record<string, string>): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const body = new URLSearchParams(form)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const payload = await response.json()
      message = payload.detail || payload.message || message
    } catch {
      message = response.statusText
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
