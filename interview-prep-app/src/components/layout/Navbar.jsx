import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bot, FileText, Home, KeyRound, LogOut, Menu, Mic, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../context/AuthContext'
import { mainNavItems } from '../../data/navigation'
import { cn } from '../../lib/cn'

const navIcons = {
  Home,
  'Mock Interview': Mic,
  'Resume Analyzer': FileText,
  'AI Mentor': Bot,
}

function NavItems({ onNavigate, mobile = false }) {
  return (
    <nav className={cn(mobile ? 'grid gap-1.5' : 'hidden items-center gap-1 rounded-2xl bg-secondary/55 p-1 md:flex')}>
      {mainNavItems.map(({ label, path }) => {
        const Icon = navIcons[label] || Home

        return (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                mobile && 'py-3',
                isActive
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted hover:bg-card/70 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
            <span>{label}</span>
            <span className="absolute inset-x-3 -bottom-1 hidden h-0.5 rounded-full bg-accent opacity-0 transition-opacity group-[.active]:opacity-100" />
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Navbar({ className }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const menuRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsMenuOpen(false)
    logout()
    navigate(ROUTES.LOGIN)
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'DP'

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b border-border/80 bg-background/88 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-foreground sm:text-base">
              Interview Prep
            </span>
          </Link>
        </div>

        <NavItems />

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <span className="hidden text-sm text-muted lg:inline">Welcome back</span>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary transition-all hover:bg-secondary/80 active:scale-95"
            aria-label="Open profile menu"
            aria-expanded={isMenuOpen}
          >
            {initials}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-primary/10"
              >
                {user?.username && (
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
                  </div>
                )}
                <Link
                  to={ROUTES.CHANGE_PASSWORD}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <KeyRound className="h-4 w-4" />
                  Change password
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
            />
            <motion.div
              className="fixed inset-x-3 top-3 z-50 rounded-3xl border border-border bg-card p-4 shadow-2xl shadow-primary/15 md:hidden"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">Interview Prep</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavItems mobile onNavigate={() => setIsMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
