import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { Button } from '../../components/ui'

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card px-6 py-12 text-center md:px-12 md:py-16">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          Ready to land your dream job?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted md:text-base">
          Join thousands of candidates who are preparing smarter with AI-powered tools.
        </p>
        <Button size="lg" className="mt-8" onClick={() => navigate(ROUTES.LOGIN)}>
          Get Started for Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
