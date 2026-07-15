import { useEffect, useState } from 'react'
import { getProfileSummary } from '../lib/api'


export function useProfileSummary() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSummary() {
      const userId = localStorage.getItem('user_id')

      if (!userId) {
        if (!cancelled) {
          setError('No user is signed in.')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        const data = await getProfileSummary(userId)
        if (cancelled) return

        // if (data?.success && data?.summary?.profile) {
        //   setProfile(data.summary.profile)
        //   setError(null)
        // } else {
        //   setProfile(null)
        //   setError('No summary is available yet.')
        // }
        if (data?.success && data?.summary) {
          setProfile(data.summary)
          setError(null)
      } else {
          setProfile(null)
          setError("No summary is available yet.")
      }
      } catch (err) {
        if (!cancelled) {
          setProfile(null)
          setError(err?.message || 'Unable to load your profile summary.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSummary()

    return () => {
      cancelled = true
    }
  }, [])

  return { profile, loading, error }
}