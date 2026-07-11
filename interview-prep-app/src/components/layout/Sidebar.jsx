import { NavLink } from 'react-router-dom'
import {
  Bot,
  FileText,
  Home,
  LayoutDashboard,
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
  Dashboard: LayoutDashboard,
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card pt-16 transition-transform duration-200 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="text-sm font-medium text-muted">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {mainNavItems.map(({ label, path }) => {
            const Icon = navIcons[label] ?? Home

            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">Interview Prep with ease</p>
        </div>
      </aside>
    </>
  )
}
