import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { ROUTES } from '../constants/routes'
import { GithubIcon } from '../components/ui'

export default function SetPasswordPage() {
  const { user, setPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isOnboarding = Boolean(location.state?.onboarding)

  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const goNext = () => navigate(ROUTES.WELCOME, { replace: true })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await setPassword(password)
      setDone(true)
      setTimeout(goNext, 1400)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 page-transition">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isOnboarding ? `Welcome, ${user?.username ?? ''}!` : 'Set a password'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isOnboarding ? (
                <span className="inline-flex items-center gap-1.5">
                  <GithubIcon className="h-3.5 w-3.5" />
                  You signed up with GitHub — add a password so you can also log in without it.
                </span>
              ) : (
                'Add a password to this account.'
              )}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-2 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="text-sm text-foreground">
                Password set! You can now log in with GitHub or your password.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Set password'}
              </button>
            </form>
          )}
        </div>

        {isOnboarding && !done && (
          <button
            type="button"
            onClick={goNext}
            className="mt-6 block w-full text-center text-sm text-muted transition-colors hover:text-foreground"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  )
}