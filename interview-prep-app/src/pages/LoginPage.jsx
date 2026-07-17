import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { ROUTES } from '../constants/routes'
import { buildGithubAuthUrl } from '../lib/githubOAuth'
import { GithubIcon } from '../components/ui'

const tabVariants = {
  initial: (direction) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -24 : 24 }),
}

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [direction, setDirection] = useState(1)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const switchMode = (nextMode) => {
    if (nextMode === mode) return
    setDirection(nextMode === 'signup' ? 1 : -1)
    setMode(nextMode)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (mode === 'signup' && !email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signup(username.trim(), email.trim(), password)
      } else {
        await login(username.trim(), password)
      }
      navigate(ROUTES.WELCOME)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGithub = () => {
    window.location.href = buildGithubAuthUrl()
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 page-transition">
      {/* ambient glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl animate-glow-slow" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-glow-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <motion.span
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          >
            <Sparkles className="h-6 w-6" />
          </motion.span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome to Interview Prep
            </h1>
            <p className="mt-1 text-sm text-muted">
              {mode === 'login' ? 'Sign in to continue your prep journey' : 'Create an account to get started'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xl shadow-black/20 transition-shadow hover:shadow-2xl hover:shadow-primary/5">
          <div className="mb-6 flex rounded-md border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`relative flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                mode === 'login' ? 'text-primary-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {mode === 'login' && (
                <motion.span
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-sm bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">Log In</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`relative flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'text-primary-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {mode === 'signup' && (
                <motion.span
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-sm bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">Sign Up</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleGithub}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
          >
            <GithubIcon className="h-4 w-4" />
            Continue with GitHub
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              or {mode === 'login' ? 'log in' : 'sign up'} with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={mode}
                custom={direction}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-3"
              >
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
                    {mode === 'login' ? 'Username or email' : 'Username'}
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'login' ? 'you@example.com' : 'Pick a username'}
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    autoComplete="username"
                  />
                </div>

                {mode === 'signup' && (
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      autoComplete="email"
                    />
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                        className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 text-sm text-danger"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
