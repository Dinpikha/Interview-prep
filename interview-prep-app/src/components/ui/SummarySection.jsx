import { Sparkles } from 'lucide-react'
import { Card, CardContent } from './Card'
import Badge from './Badge'

const CHIP_KEYS = ['skills']

function isEmptyValue(value) {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  const normalized = String(value).trim().toLowerCase()
  return normalized === '' || normalized === 'none specified' || normalized === 'n/a'
}

function ProfileField({ label, value }) {
  if (isEmptyValue(value)) return null

  const isChips = CHIP_KEYS.includes(label.toLowerCase())

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>

      {Array.isArray(value) ? (
        isChips ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {value.map((item, i) => (
              <Badge key={i} variant="primary">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {value.map((item, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="mt-1 text-sm text-muted">{value}</p>
      )}
    </div>
  )
}

/**
 * Summary banner shown at the top of a page, rendering the AI mentor's
 * structured profile of the user (career goal, skills, experience, etc).
 *
 * Pass `profile` as the object returned from `/return_summary`
 * (`data.summary.profile`), e.g.:
 * {
 *   "Career goal": "...",
 *   "Skills": ["Python", "SQL"],
 *   "Experience": ["...", "..."],
 *   ...
 * }
 */
export default function SummarySection({
  title = 'Summary',
  description = 'A quick recap before you dive in.',
  profile = null,
  loading = false,
  error = null,
  className = '',
}) {
  const entries = profile ? Object.entries(profile).filter(([, value]) => !isEmptyValue(value)) : []

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

        {loading && <p className="text-sm text-muted">Loading your profile summary…</p>}

        {!loading && error && <p className="text-sm text-muted">{error}</p>}

        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-muted">
            No summary yet — keep chatting with your mentor and it'll build up here.
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map(([label, value]) => (
              <ProfileField key={label} label={label} value={value} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}