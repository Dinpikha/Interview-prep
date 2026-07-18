import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { ROUTES } from '../constants/routes'
import { PageHeader } from '../components/ui'

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!user?.has_password) {
    return (
      <div className="mx-auto max-w-lg page-transition">
        <PageHeader
          title="Change password"
          description="This account doesn't have a password yet."
        />
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <p className="text-sm text-foreground">
            You signed up with GitHub, so there's no password to change yet. Set one first —
            then you'll be able to log in with either GitHub or a password.
          </p>
          <Link
            to={ROUTES.SET_PASSWORD}
            className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            <KeyRound className="h-4 w-4" />
            Set a password
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg page-transition">
      <PageHeader
        title="Change password"
        description="Update your password. You'll stay signed in on this device."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="current" className="mb-1.5 block text-sm font-medium text-foreground">
              Current password
            </label>
            <input
              id="current"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label htmlFor="new" className="mb-1.5 block text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <input
                id="new"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id="confirm"
              type={showPasswords ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-sm text-success"
            >
              <CheckCircle2 className="h-4 w-4" />
              Password changed successfully
            </motion.p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}