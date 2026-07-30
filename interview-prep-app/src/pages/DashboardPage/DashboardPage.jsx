import { Button, EmptyState, PageHeader, SummarySection } from '../../components/ui'
import { AlertTriangle } from 'lucide-react'
import StatsOverview from './StatsOverview'
import WeeklyProgress from './WeeklyProgress'
import PerformanceBreakdown from './PerformanceBreakdown'
import ActivityTimeline from './ActivityTimeline'
import { useDashboardData, useProfileSummary } from '../../hooks'

export default function DashboardPage() {
  const { profile, loading, error } = useProfileSummary()
  const {
    data,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData()

  return (
    <div className="space-y-10">
      <SummarySection
        title="Report Summary"
        description="A snapshot of what your mentor knows about your goals and progress."
        profile={profile}
        loading={loading}
        error={error}
      />

      <PageHeader
        title="Dashboard"
        description="Track your interview prep progress, scores, and activity over time."
      >
        <Button variant="outline" size="sm">
          Last 7 days
        </Button>
      </PageHeader>

      <div>
        <StatsOverview stats={data?.stats} loading={dashboardLoading} />
      </div>

      {dashboardError && !dashboardLoading ? (
        <EmptyState
          icon={AlertTriangle}
          title="Dashboard unavailable"
          description={dashboardError}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <WeeklyProgress
              weeklyProgress={data?.weeklyProgress}
              scoreTrend={data?.scoreTrend}
              loading={dashboardLoading}
            />
            <PerformanceBreakdown
              performanceAreas={data?.performanceAreas}
              loading={dashboardLoading}
            />
          </div>

          <ActivityTimeline
            recentActivity={data?.recentActivity}
            loading={dashboardLoading}
          />
        </div>
      )}
    </div>
  )
}
