import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

export default function Select({
  label,
  id,
  className,
  wrapperClassName,
  placeholder = 'Select an option',
  options = [],
  value,
  onChange,
  ...props
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  )
  const selected = normalized.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (optionValue) => {
    setOpen(false)
    onChange?.({ target: { value: optionValue } })
  }

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={selectId}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            selected ? 'text-foreground' : 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <svg
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            className={cn(
              'absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg',
              'max-h-64 overflow-y-auto',
            )}
          >
            {normalized.map((option) => {
              const isSelected = option.value === value
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-border/50',
                  )}
                >
                  {option.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}