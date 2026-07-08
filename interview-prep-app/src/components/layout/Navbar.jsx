import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Sparkles } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

export default function Navbar({ onMenuClick, className }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
        'fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-card/80 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-foreground md:text-base">
              Interview Prep
            </span>
          </Link>
        </div>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          <span className="hidden text-sm text-muted sm:inline">Welcome back</span>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label="Open profile menu"
            aria-expanded={isMenuOpen}
          >
            {initials}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-11 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {user?.username && (
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.username}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}