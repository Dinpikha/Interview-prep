import { cn } from '../../lib/cn'

export default function ProgressBar({ value, max = 100, label, showValue = true, className }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted">{label}</span>}
          {showValue && <span className="font-medium text-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
