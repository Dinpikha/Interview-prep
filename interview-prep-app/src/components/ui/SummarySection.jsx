import { Sparkles } from 'lucide-react'
import { Card, CardContent } from './Card'

/**
 * Summary banner shown at the top of a page.
 * Pass `title`, `description`, and a list of `points` (placeholder data for now
 * — swap in the real report summary when it's ready).
 */
export default function SummarySection({
  title = 'Summary',
  description = 'A quick recap before you dive in.',
  points = [],
  className = '',
}) {
  return (
    <Card className={`mb-8 ${className}`}>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold leading-none text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-muted">
          {points.map((point, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}