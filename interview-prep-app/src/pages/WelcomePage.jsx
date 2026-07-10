import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../constants/routes'

const REDIRECT_DELAY_MS = 2500

export default function WelcomePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    const timer = setTimeout(() => {
      navigate(ROUTES.HOME, { replace: true })
    }, REDIRECT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome {user?.username ? `, ${user.username}` : ''}!
      </h1>
      <p className="text-sm text-muted">Getting things ready for you...</p>
    </div>
  )
}