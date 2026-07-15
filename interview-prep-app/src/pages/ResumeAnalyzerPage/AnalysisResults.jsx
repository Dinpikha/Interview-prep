import {
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Contact,
  Code2,
  Globe,
  ListChecks,
  Flame,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '../../components/ui'

const tier = (score) => {
  if (typeof score !== 'number') return 'default'
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'danger'
}

const IMPACT_CONFIG = {
  high: { icon: Flame, border: 'border-l-danger', badge: 'danger' },
  medium: { icon: AlertTriangle, border: 'border-l-warning', badge: 'warning' },
  low: { icon: Info, border: 'border-l-primary', badge: 'primary' },
}

function ScoreRing({ score }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const strokeColor =
    tier(score) === 'success'
      ? 'var(--color-success)'
      : tier(score) === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-danger)'

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold leading-none text-foreground">{score ?? '–'}</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  )
}

function ScoreBar({ score, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  const color =
    tier(score) === 'success' ? 'bg-success' : tier(score) === 'warning' ? 'bg-warning' : 'bg-danger'
  const height = size === 'sm' ? 'h-1' : 'h-1.5'

  return (
    <div className={`${height} w-full overflow-hidden rounded-full bg-border`}>
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function QuickScore({ label, score }) {
  if (typeof score !== 'number') return null
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-xs font-semibold text-foreground">{score}</span>
      </div>
      <ScoreBar score={score} size="sm" />
    </div>
  )
}

function TagList({ items, tone }) {
  if (!items?.length) return null
  const toneClass =
    tone === 'positive'
      ? 'border-success/30 bg-success/10 text-success'
      : 'border-danger/30 bg-danger/10 text-danger'

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={`rounded-md border px-2 py-1 text-xs leading-tight ${toneClass}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function SectionCard({ title, score, summary, positives, negatives, negativesLabel }) {
  if (score == null && !summary && !positives?.length && !negatives?.length) return null

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {typeof score === 'number' && <span className="text-sm font-semibold text-foreground">{score}</span>}
      </div>

      {typeof score === 'number' && <ScoreBar score={score} />}

      {summary && <p className="text-xs leading-relaxed text-muted">{summary}</p>}

      {positives?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Working well
          </p>
          <TagList items={positives} tone="positive" />
        </div>
      )}

      {negatives?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {negativesLabel}
          </p>
          <TagList items={negatives} tone="negative" />
        </div>
      )}
    </div>
  )
}

function LinkStatus({ icon: Icon, label, data }) {
  if (!data) return null
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          data.present ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs leading-relaxed text-muted">{data.feedback}</p>
      </div>
    </div>
  )
}

export default function AnalysisResults({ hasResults, analysis }) {
  if (!hasResults) {
    return (
      <EmptyState
        icon={Tag}
        title="No analysis yet"
        description="Upload your resume, paste the job description, and click Analyze to see results here."
      />
    )
  }

  if (!analysis) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Analysis failed"
        description="Something went wrong while analyzing your resume. Please try again."
      />
    )
  }

  const {
    overall_score: overallScore,
    summary,
    strengths = [],
    weaknesses = [],
    priority_improvements: priorityImprovements = [],
    ats,
    experience,
    projects,
    skills,
    education,
    links,
    final_recommendation: finalRecommendation,
  } = analysis

  const quickScores = [
    { label: 'ATS', score: ats?.score },
    { label: 'Experience', score: experience?.score },
    { label: 'Projects', score: projects?.score },
    { label: 'Skills', score: skills?.score },
    { label: 'Education', score: education?.score },
  ].filter((s) => typeof s.score === 'number')

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ScoreRing score={overallScore} />
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                {summary?.headline || 'Resume Analysis'}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{summary?.overview}</p>
            </div>
          </div>

          {quickScores.length > 0 && (
            <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5">
              {quickScores.map((s) => (
                <QuickScore key={s.label} label={s.label} score={s.score} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths / Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <Card>
          <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 sm:divide-x sm:divide-border">
            {strengths.length > 0 && (
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Strengths
                </p>
                <ul className="space-y-2">
                  {strengths.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div className="space-y-2.5 sm:pl-6">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <XCircle className="h-3.5 w-3.5 text-danger" />
                  Weaknesses
                </p>
                <ul className="space-y-2">
                  {weaknesses.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Priority improvements */}
      {priorityImprovements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <CardTitle>Priority Improvements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {priorityImprovements.map((item, i) => {
              const config = IMPACT_CONFIG[(item.impact || '').toLowerCase()] || IMPACT_CONFIG.low
              const ImpactIcon = config.icon
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border border-border border-l-4 ${config.border} bg-background p-4`}
                >
                  <ImpactIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <Badge variant={config.badge}>{item.impact}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{item.reason}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Section breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
          <SectionCard
            title="ATS Compatibility"
            score={ats?.score}
            summary={ats?.summary}
            positives={ats?.passed_checks}
            negatives={ats?.failed_checks}
            negativesLabel="Failed checks"
          />
          <SectionCard
            title="Experience"
            score={experience?.score}
            summary={experience?.summary}
            positives={experience?.strengths}
            negatives={experience?.improvements}
            negativesLabel="Improvements"
          />
          <SectionCard
            title="Projects"
            score={projects?.score}
            summary={projects?.summary}
            positives={projects?.strengths}
            negatives={projects?.improvements}
            negativesLabel="Improvements"
          />
          <SectionCard
            title="Skills"
            score={skills?.score}
            summary={skills?.summary}
            positives={skills?.strengths}
            negatives={skills?.missing_skills}
            negativesLabel="Missing skills"
          />
          <SectionCard title="Education" score={education?.score} summary={education?.summary} />
        </CardContent>
      </Card>

      {/* Links */}
      {links && (
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
            <LinkStatus icon={Contact} label="LinkedIn" data={links.linkedin} />
            <LinkStatus icon={Code2} label="GitHub" data={links.github} />
            <LinkStatus icon={Globe} label="Portfolio" data={links.portfolio} />
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      {finalRecommendation && (
        <div
          className={`rounded-xl border p-5 ${
            finalRecommendation.ready_for_applications
              ? 'border-success/30 bg-success/5'
              : 'border-warning/30 bg-warning/5'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  finalRecommendation.ready_for_applications
                    ? 'bg-success/15 text-success'
                    : 'bg-warning/15 text-warning'
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {finalRecommendation.ready_for_applications
                    ? 'Ready to apply'
                    : 'Not quite ready yet'}
                </p>
                {typeof finalRecommendation.confidence === 'number' && (
                  <p className="text-xs text-muted">
                    {finalRecommendation.confidence}% confidence
                  </p>
                )}
              </div>
            </div>
          </div>

          {finalRecommendation.next_steps?.length > 0 && (
            <ol className="mt-4 space-y-2.5 border-t border-border pt-4">
              {finalRecommendation.next_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}