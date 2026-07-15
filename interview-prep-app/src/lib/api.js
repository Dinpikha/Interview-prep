import { emitToast } from './toastBus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    const message = 'Unable to reach the server. Check your connection and try again.'
    emitToast({ variant: 'error', title: 'Connection error', message })
    throw new ApiError(message, 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
   
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