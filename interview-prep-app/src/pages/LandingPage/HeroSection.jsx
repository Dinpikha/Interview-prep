import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { Button } from '../../components/ui'

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-32 md:px-6 md:pt-40">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted">
          AI-powered interview preparation platform
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl md:leading-tight">
          Ace your next interview with{' '}
          <span className="text-primary">confidence</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
          Practice mock interviews, get instant resume feedback, and learn from
          your AI mentor — all in one place. Land your dream job faster.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate(ROUTES.HOME)}
          >
            Start Practicing
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}
          >
            <Play className="h-4 w-4" />
            Try Mock Interview
          </Button>
        </div>
      </div>
    </section>
  )
}
