import { Sparkles } from 'lucide-react'

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Interview Prep</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Interview Prep. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
