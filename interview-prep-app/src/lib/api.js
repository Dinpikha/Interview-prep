import { emitToast } from './toastBus'
import {
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
} from './tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let refreshPromise = null

async function doRefresh() {
  const refresh_token = getRefreshToken()
  if (!refresh_token) return false

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setSession(data)
    return true
  } catch {
    return false
  }
}

/**
 * Core request helper. Attaches the access token automatically, and — on a
 * single 401 — tries one silent refresh + retry before giving up. Callers
 * don't need to think about tokens at all beyond `login`/`logout`.
 */
export async function apiRequest(path, options = {}, { auth = true, _retried = false } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }

  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    const message = 'Unable to reach the server. Check your connection and try again.'
    emitToast({ variant: 'error', title: 'Connection error', message })
    throw new ApiError(message, 0)
  }

  if (response.status === 401 && auth && !_retried) {
    const refreshed = await (refreshPromise ??= doRefresh().finally(() => {
      refreshPromise = null
    }))
    if (refreshed) {
      return apiRequest(path, options, { auth, _retried: true })
    }
    clearSession()
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // no JSON body — fine for some 204s etc.
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Something went wrong (${response.status}).`
    emitToast({ variant: 'error', title: 'Request failed', message })
    throw new ApiError(message, response.status)
  }

  return data
}

export function getProfileSummary(userId) {
  return apiRequest('/return_summary', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

// ---------------------------------------------------------------- auth API
export const authApi = {
  signup: (username, email, password) =>
    apiRequest(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify({ username, email, password }) },
      { auth: false },
    ),

  login: (identifier, password) =>
    apiRequest(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ identifier, password }) },
      { auth: false },
    ),

  githubLogin: (code) =>
    apiRequest(
      '/auth/github',
      { method: 'POST', body: JSON.stringify({ code }) },
      { auth: false },
    ),

  logout: (refresh_token) =>
    apiRequest(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refresh_token }) },
      { auth: false },
    ),

  forgotPassword: (email) =>
    apiRequest(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
      { auth: false },
    ),

  resetPassword: (token, new_password) =>
    apiRequest(
      '/auth/reset-password',
      { method: 'POST', body: JSON.stringify({ token, new_password }) },
      { auth: false },
    ),

  changePassword: (current_password, new_password) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),
}
