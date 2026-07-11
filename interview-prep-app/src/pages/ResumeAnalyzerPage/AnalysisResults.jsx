import {
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Contact,
  Code2,
  Globe,
  ListChecks,
} from 'lucide-react'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '../../components/ui'

const scoreVariant = (score) => {
  if (typeof score !== 'number') return 'default'
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'danger'
}

const impactVariant = (impact) => {
  const value = (impact || '').toLowerCase()
  if (value === 'high') return 'danger'
  if (value === 'medium') return 'warning'
  return 'primary'
}

function ScoreRing({ score }) {
  return (
    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-border">
      <span className="text-2xl font-semibold text-foreground">{score ?? '–'}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted">score</span>
    </div>
  )
}

function SectionCard({ title, score, summary, positives, positivesLabel, negatives, negativesLabel }) {
  if (!score && !summary && !positives?.length && !negatives?.length) return null

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {typeof score === 'number' && <Badge variant={scoreVariant(score)}>{score}/100</Badge>}
      </div>

      {summary && <p className="mb-3 text-sm text-muted">{summary}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {positives?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{positivesLabel}</p>
            <ul className="space-y-1">
              {positives.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {negatives?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{negativesLabel}</p>
            <ul className="space-y-1">
              {negatives.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-foreground">
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-danger" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
        <p className="text-xs text-muted">{data.feedback}</p>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <ScoreRing score={overallScore} />
          <div className="space-y-1">
            <CardTitle>{summary?.headline || 'Resume Analysis'}</CardTitle>
            <CardDescription>{summary?.overview}</CardDescription>
          </div>
        </CardContent>
      </Card>

      {(strengths.length > 0 || weaknesses.length > 0) && (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            {strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted">Strengths</p>
                <ul className="space-y-1.5">
                  {strengths.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted">Weaknesses</p>
                <ul className="space-y-1.5">
                  {weaknesses.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {priorityImprovements.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <CardTitle>Priority Improvements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {priorityImprovements.map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.reason}</p>
                </div>
                <Badge variant={impactVariant(item.impact)} className="shrink-0">
                  {item.impact}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <SectionCard
            title="ATS Compatibility"
            score={ats?.score}
            summary={ats?.summary}
            positives={ats?.passed_checks}
            positivesLabel="Passed checks"
            negatives={ats?.failed_checks}
            negativesLabel="Failed checks"
          />
          <SectionCard
            title="Experience"
            score={experience?.score}
            summary={experience?.summary}
            positives={experience?.strengths}
            positivesLabel="Strengths"
            negatives={experience?.improvements}
            negativesLabel="Improvements"
          />
          <SectionCard
            title="Projects"
            score={projects?.score}
            summary={projects?.summary}
            positives={projects?.strengths}
            positivesLabel="Strengths"
            negatives={projects?.improvements}
            negativesLabel="Improvements"
          />
          <SectionCard
            title="Skills"
            score={skills?.score}
            summary={skills?.summary}
            positives={skills?.strengths}
            positivesLabel="Strengths"
            negatives={skills?.missing_skills}
            negativesLabel="Missing skills"
          />
          <SectionCard title="Education" score={education?.score} summary={education?.summary} />
        </CardContent>
      </Card>

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

      {finalRecommendation && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Ready to apply?</p>
              <Badge variant={finalRecommendation.ready_for_applications ? 'success' : 'warning'}>
                {finalRecommendation.ready_for_applications ? 'Ready' : 'Not yet'}
                {typeof finalRecommendation.confidence === 'number' &&
                  ` · ${finalRecommendation.confidence}% confidence`}
              </Badge>
            </div>

            {finalRecommendation.next_steps?.length > 0 && (
              <ul className="space-y-1.5">
                {finalRecommendation.next_steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-0.5 text-muted">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}