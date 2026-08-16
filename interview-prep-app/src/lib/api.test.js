import { describe, expect, it, vi } from 'vitest'
import { apiRequest, ApiError } from './api'
import { setSession } from './tokenStorage'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiRequest', () => {
  it('adds the bearer token when auth is enabled', async () => {
    setSession({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: { user_id: 'user-1' },
    })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/dashboard', { method: 'POST', body: '{}' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/dashboard',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    )
  })

  it('refreshes once after a 401 and retries the original request', async () => {
    setSession({
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      user: { user_id: 'user-1' },
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user: { user_id: 'user-1' },
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiRequest('/dashboard', { method: 'POST', body: '{}' })

    expect(result).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8000/auth/refresh')
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access')
  })

  it('throws ApiError with backend detail on failed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Nope' }, { status: 400 })))

    await expect(apiRequest('/bad', { method: 'POST' }, { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Nope',
      status: 400,
    })
  })

  it('wraps network failures in ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(apiRequest('/dashboard')).rejects.toBeInstanceOf(ApiError)
  })
})
