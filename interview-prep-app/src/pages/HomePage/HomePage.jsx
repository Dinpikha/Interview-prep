import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bot,
  FileText,
  Flame,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ProgressBar, SummarySection } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useDashboardData, useProfileSummary } from '../../hooks'
import WeeklyProgress from '../DashboardPage/WeeklyProgress'
import PerformanceBreakdown from '../DashboardPage/PerformanceBreakdown'
import RecentActivity from './RecentActivity'

const statIcons = {
  interviews: Mic,
  sessions: BarChart3,
  score: TrendingUp,
  resumes: FileText,
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function CommandMetric({ stat, loading }) {
  const Icon = statIcons[stat?.id] || Sparkles

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="subtle-lift h-full overflow-hidden">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            {stat?.change && <span className="text-xs font-medium text-muted">{stat.change}</span>}
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="h-7 w-20 rounded bg-secondary animate-shimmer" />
              <div className="h-3 w-28 rounded bg-secondary animate-shimmer" />
            </div>
          ) : stat ? (
            <div>
              <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground">Waiting for data</p>
              <p className="mt-1 text-sm text-muted">This metric will appear after activity is recorded.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecommendedNextStep({ recommendation, loading, onStart }) {
  return (
    <Card className="workspace-card overflow-hidden border-primary/15 bg-primary text-primary-foreground">
      <CardContent className="space-y-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/80">Recommended Next Step</p>
            {loading ? (
              <div className="mt-3 h-6 w-64 max-w-full rounded bg-white/15" />
            ) : recommendation ? (
              <>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
                  Practice {recommendation.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  This is the lowest scored area currently available in your progress data.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
                  Start a focused practice session
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  No recommendation data is available yet. Complete a mock interview or analyze your resume to unlock better guidance.
                </p>
              </>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          className="bg-white text-primary hover:bg-white/90"
          onClick={onStart}
        >
          Start Practice
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function SkillChips({ title, items, tone = 'primary' }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item.label} variant={tone}>
                {item.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No scored areas available yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading, error: profileError } = useProfileSummary()
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData()

  const stats = dashboardData?.stats || []
  const performanceAreas = useMemo(
    () => dashboardData?.performanceAreas || [],
    [dashboardData?.performanceAreas],
  )
  const recommendation = useMemo(() => {
    if (!performanceAreas.length) return null
    return [...performanceAreas].sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0]
  }, [performanceAreas])
  const strengths = performanceAreas.filter((area) => area.score >= 75)
  const needsWork = performanceAreas.filter((area) => area.score < 75)
  const readiness = stats.find((stat) => /readiness|score/i.test(stat.label || stat.id || ''))

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Interview preparation command center</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {greeting()}, {user?.username || 'there'} 👋
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
                Here’s where you are with your interview preparation and what to focus on next.
              </p>
            </div>
            <Button onClick={() => navigate(ROUTES.AI_MENTOR)}>
              <Bot className="h-4 w-4" />
              Ask AI Mentor
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(dashboardLoading ? [0, 1, 2, 3] : stats.slice(0, 4)).map((stat, index) => (
              <CommandMetric
                key={stat?.id || index}
                stat={dashboardLoading ? null : stat}
                loading={dashboardLoading}
              />
            ))}
          </div>
        </div>

        <RecommendedNextStep
          recommendation={recommendation}
          loading={dashboardLoading}
          onStart={() => navigate(ROUTES.MOCK_INTERVIEW)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="workspace-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              <CardTitle>Preparation Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {dashboardLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-36 rounded bg-secondary animate-shimmer" />
                <div className="h-2.5 rounded-full bg-secondary animate-shimmer" />
              </div>
            ) : readiness ? (
              <ProgressBar label={readiness.label} value={Number.parseFloat(readiness.value) || 0} />
            ) : (
              <p className="text-sm text-muted">
                Complete practice sessions to populate readiness and progress metrics.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <SkillChips title="Strengths" items={strengths} tone="success" />
              <SkillChips title="Needs Work" items={needsWork} tone="warning" />
            </div>
          </CardContent>
        </Card>

        <WeeklyProgress
          weeklyProgress={dashboardData?.weeklyProgress}
          scoreTrend={dashboardData?.scoreTrend}
          loading={dashboardLoading}
        />
      </section>

      {dashboardError && !dashboardLoading ? (
        <EmptyState
          icon={Sparkles}
          title="Progress data unavailable"
          description={dashboardError}
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <PerformanceBreakdown
            performanceAreas={performanceAreas}
            loading={dashboardLoading}
          />
          <RecentActivity
            recentActivity={dashboardData?.recentActivity}
            loading={dashboardLoading}
          />
        </section>
      )}

      <SummarySection
        title="What your AI mentor knows"
        description="This profile updates from your conversations, resume, and practice history."
        profile={profile}
        loading={profileLoading}
        error={profileError}
      />
    </div>
  )
}
