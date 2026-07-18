import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../constants/routes'
import { ApiError } from '../lib/api'
import { consumeGithubOAuthState } from '../lib/githubOAuth'
import { GithubIcon } from '../components/ui'

export default function GithubCallbackPage() {
  const [searchParams] = useSearchParams()
  const { loginWithGithub } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const ranOnce = useRef(false)

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const expectedState = consumeGithubOAuthState()

    async function run() {
      if (!code) {
        setError('GitHub did not return an authorization code.')
        return
      }
      if (expectedState && state !== expectedState) {
        setError('Security check failed (state mismatch). Please try signing in again.')
        return
      }

      try {
        const loggedInUser = await loginWithGithub(code)
        if (!loggedInUser?.has_password) {
          // First time this GitHub account has ever logged in here — give
          // them the option to set a password so they're not locked into
          // GitHub-only login forever.
          navigate(ROUTES.SET_PASSWORD, { replace: true, state: { onboarding: true } })
        } else {
          navigate(ROUTES.WELCOME, { replace: true })
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'GitHub sign-in failed.')
      }
    }

    // Defer to a microtask so no setState call happens synchronously
    // inside the effect body itself.
    Promise.resolve().then(run)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center page-transition">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <GithubIcon className="h-7 w-7" />
      </span>

      {error ? (
        <>
          <div className="flex items-center gap-2 text-danger">
            <TriangleAlert className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Back to login
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Finishing GitHub sign-in…</p>
          </div>
          <p className="text-xs text-muted">This only takes a second.</p>
        </>
      )}
    </div>
  )
}