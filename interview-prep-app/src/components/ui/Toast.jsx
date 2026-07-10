import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/cn'

const VARIANTS = {
  error: { icon: AlertCircle, ring: 'border-danger/30', iconWrap: 'bg-danger/10 text-danger', bar: 'bg-danger' },
  warning: { icon: AlertTriangle, ring: 'border-warning/30', iconWrap: 'bg-warning/10 text-warning', bar: 'bg-warning' },
  success: { icon: CheckCircle2, ring: 'border-success/30', iconWrap: 'bg-success/10 text-success', bar: 'bg-success' },
}

export default function Toast({ title, message, variant = 'error', duration = 6000, onDismiss }) {
  const [leaving, setLeaving] = useState(false)
  const { icon: Icon, ring, iconWrap, bar } = VARIANTS[variant] ?? VARIANTS.error

  const handleDismiss = () => {
    setLeaving(true)
    setTimeout(onDismiss, 180)
  }

  useEffect(() => {
    if (!duration) return undefined
    const timer = setTimeout(handleDismiss, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border bg-card shadow-lg',
        ring,
        leaving ? 'animate-toast-out' : 'animate-toast-in',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconWrap)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          <p className="mt-0.5 text-sm text-muted">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {duration > 0 && (
        <div className="h-1 w-full bg-secondary">
          <div
            className={cn('h-full origin-left', bar)}
            style={{ animation: leaving ? 'none' : `toast-progress ${duration}ms linear forwards` }}
          />
        </div>
      )}
    </div>
  )
}