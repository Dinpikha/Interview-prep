import { Button, PageHeader } from '../../components/ui'
import StatsOverview from './StatsOverview'
import WeeklyProgress from './WeeklyProgress'
import PerformanceBreakdown from './PerformanceBreakdown'
import ActivityTimeline from './ActivityTimeline'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Track your interview prep progress, scores, and activity over time."
      >
        <Button variant="outline" size="sm">
          Last 7 days
        </Button>
      </PageHeader>

      <div className="mb-8">
        <StatsOverview />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <WeeklyProgress />
        <PerformanceBreakdown />
      </div>

      <ActivityTimeline />
    </div>
  )
}
