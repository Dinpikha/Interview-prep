import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { Button } from '../../components/ui'

export default function LandingNavbar() {
  const navigate = useNavigate()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground md:text-base">
            Interview Prep
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted transition-colors hover:text-foreground">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.HOME)}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate(ROUTES.HOME)}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
