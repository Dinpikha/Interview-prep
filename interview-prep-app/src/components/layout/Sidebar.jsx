import { NavLink } from 'react-router-dom'
import {
  Bot,
  FileText,
  Home,
  Mic,
  X,
} from 'lucide-react'
import { mainNavItems } from '../../data/navigation'
import { cn } from '../../lib/cn'

const navIcons = {
  Home,
  'Mock Interview': Mic,
  'Resume Analyzer': FileText,
  'AI Mentor': Bot,
}

export default function Sidebar({ isOpen, onClose, className }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/80 bg-card/95 pt-16 shadow-xl shadow-primary/5 backdrop-blur-xl transition-transform duration-200 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="text-sm font-medium text-muted">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-3 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-3 py-1">
          {mainNavItems.map(({ label, path }) => {
            const Icon = navIcons[label] ?? Home

            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                      : 'text-muted hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-105" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Personal interview prep, guided by your progress.
          </p>
        </div>
      </aside>
    </>
  )
}
