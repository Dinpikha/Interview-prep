import { useEffect, useState } from 'react'
import { getDashboardData } from '../lib/api'
import { getUserId } from '../lib/tokenStorage'

export function useDashboardData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchDashboardData() {
      const userId = getUserId()

      if (!userId) {
        if (!cancelled) {
          setError('No user is signed in.')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        const response = await getDashboardData(userId)
        if (cancelled) return

        if (response?.success) {
          setData(response)
          setError(null)
        } else {
          setData(null)
          setError('Dashboard data is unavailable.')
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err?.message || 'Unable to load dashboard data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboardData()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
