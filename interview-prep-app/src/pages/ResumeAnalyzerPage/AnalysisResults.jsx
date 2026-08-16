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
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
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

function ScoreRing({ score, inverse = false }) {
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
        <span className={inverse ? 'text-3xl font-bold leading-none text-white' : 'text-3xl font-bold leading-none text-foreground'}>{score ?? '–'}</span>
        <span className={inverse ? 'mt-1 text-[10px] font-medium uppercase tracking-wider text-white/60' : 'mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground'}>
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

function SectionCard({ title, score, summary, positives, negatives, negativesLabel, suggestions }) {
  if (score == null && !summary && !positives?.length && !negatives?.length && !suggestions?.length) {
    return null
  }

  return (
    <div className="space-y-3 rounded-xl border-l-4 border-l-primary bg-secondary/28 p-4">
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

      {suggestions?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggestions
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed text-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const SECTION_LABELS = {
  summary: 'Professional Summary',
  education: 'Education',
  experience: 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
  achievements: 'Achievements',
}

function MissingSectionCard({ title, feedback, suggestions }) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Badge>Not found</Badge>
      </div>
      {feedback && <p className="text-xs leading-relaxed text-muted">{feedback}</p>}
      {suggestions?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggestions
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed text-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SuggestedRewrite({ rewrite }) {
  if (!rewrite) return null
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
        Suggested rewrite
      </p>
      <p className="mt-1 text-xs leading-relaxed text-foreground">{rewrite}</p>
    </div>
  )
}

function SectionBreakdownCard({ breakdown }) {
  const entries = Object.keys(SECTION_LABELS)
    .map((key) => [key, breakdown?.[key]])
    .filter(([, section]) => section)

  if (!entries.length) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Section Breakdown</h2>
        <p className="mt-1 text-sm text-muted">
          Section-by-section feedback based on what the resume includes and what it is missing.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map(([key, section]) => {
          if (section.present === false) {
            return (
              <MissingSectionCard
                key={key}
                title={SECTION_LABELS[key]}
                feedback={section.feedback}
                suggestions={section.suggestions}
              />
            )
          }

          return (
            <div key={key} className="space-y-3">
              <SectionCard
                title={SECTION_LABELS[key]}
                score={section.score}
                summary={section.feedback}
                positives={section.strengths}
                negatives={section.weaknesses}
                negativesLabel="Areas to improve"
                suggestions={section.suggestions}
              />
              {key === 'summary' && <SuggestedRewrite rewrite={section.improved_rewrite} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ReportOverview({ title, score, secondaryScores = [], review, badge }) {
  return (
    <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/10 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={score} inverse />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {badge}
          </div>
          {review && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/78">{review}</p>}
        </div>
      </div>

      {secondaryScores.length > 0 && (
        <div className="mt-6 grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-3">
          {secondaryScores.map(({ label, score: itemScore }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white/70">{label}</span>
                <span className="text-xs font-semibold text-white">{itemScore}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${Math.max(0, Math.min(100, itemScore ?? 0))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ConnectedListSection({ strengths = [], weaknesses = [] }) {
  if (!strengths.length && !weaknesses.length) return null

  return (
    <section className="grid gap-8 rounded-3xl bg-card/70 p-5 sm:p-6 md:grid-cols-2 md:divide-x md:divide-border">
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" />
          Strengths
        </p>
        <ul className="space-y-3">
          {strengths.map((item, i) => (
            <li key={i} className="border-l-2 border-success/40 pl-3 text-sm leading-relaxed text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 md:pl-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <XCircle className="h-4 w-4 text-danger" />
          Areas to Improve
        </p>
        <ul className="space-y-3">
          {weaknesses.map((item, i) => (
            <li key={i} className="border-l-2 border-danger/35 pl-3 text-sm leading-relaxed text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SkillMatchSection({ matching = [], missing = [] }) {
  if (!matching.length && !missing.length) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Skills Match</h2>
        <p className="mt-1 text-sm text-muted">Skills detected against the target role.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matching skills</p>
          <TagList items={matching} tone="positive" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missing skills</p>
          <TagList items={missing} tone="negative" />
        </div>
      </div>
    </section>
  )
}

function RecommendationTimeline({ items = [] }) {
  if (!items.length) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-accent" />
        <h2 className="text-xl font-semibold text-foreground">Recommendations</h2>
      </div>
      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="grid gap-3 sm:grid-cols-[3rem_1fr]">
            <span className="text-lg font-semibold tabular-nums text-accent">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="border-l border-border pl-4 text-sm leading-relaxed text-foreground">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RawParsedDataDisclosure({ structured }) {
  if (!structured) return null

  return (
    <details className="rounded-lg border border-border bg-background">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted">
        View raw parsed data
      </summary>
      <div className="border-t border-border p-4">
        <ParsedResumeBreakdown structured={structured} />
      </div>
    </details>
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

function FieldList({ items }) {
  const entries = Object.entries(items || {}).filter(([, value]) => {
    if (value == null) return false
    if (Array.isArray(value)) return value.length > 0
    return String(value).trim().length > 0
  })

  if (!entries.length) return null

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md bg-secondary/40 px-3 py-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {key.replaceAll('_', ' ')}
          </dt>
          <dd className="mt-1 text-foreground">
            {Array.isArray(value) ? value.join(', ') : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function BulletList({ items }) {
  if (!items?.length) return null

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm leading-relaxed text-foreground">
          {item}
        </li>
      ))}
    </ul>
  )
}

function ParsedResumeSection({ icon: Icon, title, children }) {
  if (!children) return null

  return (
    <div className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-secondary/15">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  )
}

function ParsedResumeBreakdown({ structured }) {
  if (!structured) return null

  const education = structured.education
  const educationEntries = Array.isArray(education) ? education : education ? [education] : []
  const projects = structured.projects?.projects || []
  const skillSets = structured.skills?.skill_sets || []
  const achievements = structured.achievements?.achievements || []

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ParsedResumeSection icon={GraduationCap} title="Education">
        {educationEntries.length > 0 ? (
          <div className="space-y-3">
            {educationEntries.map((entry, index) => (
              <FieldList key={`${entry.institution || 'education'}-${index}`} items={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No education section detected.</p>
        )}
      </ParsedResumeSection>

      <ParsedResumeSection icon={Wrench} title="Skills">
        {skillSets.length > 0 ? (
          <div className="space-y-3">
            {skillSets.map((set, index) => (
              <div key={`${set.category || 'skills'}-${index}`} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {set.category || 'Skills'}
                </p>
                <TagList items={set.skills} tone="positive" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No skills section detected.</p>
        )}
      </ParsedResumeSection>

      <ParsedResumeSection icon={FolderGit2} title="Projects">
        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={`${project.name || 'project'}-${index}`} className="rounded-md bg-secondary/35 p-3">
                <p className="text-sm font-medium text-foreground">{project.name || 'Project'}</p>
                {project.description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">{project.description}</p>
                )}
                <TagList items={project.technologies} tone="positive" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No projects section detected.</p>
        )}
      </ParsedResumeSection>

      <ParsedResumeSection icon={Award} title="Achievements">
        {achievements.length > 0 ? (
          <ul className="space-y-2">
            {achievements.map((achievement, index) => (
              <li key={`${achievement.title || 'achievement'}-${index}`} className="rounded-md bg-secondary/35 p-3">
                <p className="text-sm font-medium text-foreground">{achievement.title}</p>
                {achievement.year && <p className="mt-1 text-xs text-muted">{achievement.year}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No achievements section detected.</p>
        )}
      </ParsedResumeSection>
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

  if (analysis.analysis === null) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Analysis failed"
        description={analysis.errors?.[0] || 'Something went wrong while analyzing your resume. Please try again.'}
      />
    )
  }

  if (analysis.analysis_type === 'summary') {
    const structured = analysis.resume?.structured
    const summary = analysis.analysis

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <ReportOverview
          title="Resume Quality"
          score={summary.overall_score}
          review={summary.overall_review}
          badge={summary.experience_level && <Badge variant="accent">{summary.experience_level}</Badge>}
        />

        <SectionBreakdownCard breakdown={summary?.section_breakdown} />

        {summary && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Key Summary</h2>
              <p className="mt-1 text-sm text-muted">Highlights and gaps from the resume-only review.</p>
            </div>
              {summary.key_skills?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Key skills
                  </p>
                  <TagList items={summary.key_skills} tone="positive" />
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-3">
                {summary.notable_strengths?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notable strengths
                    </p>
                    <BulletList items={summary.notable_strengths} />
                  </div>
                )}

                {summary.potential_gaps?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Potential gaps
                    </p>
                    <BulletList items={summary.potential_gaps} />
                  </div>
                )}

                {summary.resume_quality_notes?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Resume quality notes
                    </p>
                    <BulletList items={summary.resume_quality_notes} />
                  </div>
                )}
              </div>
          </section>
        )}

        <RawParsedDataDisclosure structured={structured} />
      </div>
    )
  }

  if (analysis.analysis && typeof analysis.analysis.match_score === 'number') {
    const fit = analysis.analysis
    const similarityScore =
      typeof analysis.similarity_score === 'number'
        ? Math.round(Math.max(0, Math.min(1, analysis.similarity_score)) * 100)
        : null

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <ReportOverview
          title={fit.recommendation || 'Fit Analysis'}
          score={fit.overall_score}
          review={fit.overall_review || fit.experience_relevance}
          badge={similarityScore !== null && <Badge variant={tier(similarityScore)}>Similarity {similarityScore}%</Badge>}
          secondaryScores={[
            { label: 'Overall Score', score: fit.overall_score },
            { label: 'Match Score', score: fit.match_score },
            ...(similarityScore !== null ? [{ label: 'Vector Similarity', score: similarityScore }] : []),
          ]}
        />

        <SectionBreakdownCard breakdown={fit.section_breakdown} />

        {fit.experience_relevance && (
          <section className="border-l-4 border-l-accent pl-4">
            <h2 className="text-xl font-semibold text-foreground">Key Summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{fit.experience_relevance}</p>
          </section>
        )}

        <SkillMatchSection matching={fit.matching_skills} missing={fit.missing_skills} />

        <ConnectedListSection strengths={fit.strengths} weaknesses={fit.weaknesses} />

        <RecommendationTimeline items={fit.improvement_suggestions} />
      </div>
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
