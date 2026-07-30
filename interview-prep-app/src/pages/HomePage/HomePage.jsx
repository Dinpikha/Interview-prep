import { useNavigate } from 'react-router-dom'
import { BarChart3, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { Button, PageHeader, StatCard, SummarySection } from '../../components/ui'
import QuickActions from './QuickActions'
import RecentActivity from './RecentActivity'
import RecommendedInterviews from './RecommendedInterviews'
import { useDashboardData, useProfileSummary } from '../../hooks'

const statIcons = {
  sessions: BarChart3,
  score: TrendingUp,
  messages: MessageSquare,
  resumes: Target,
}

export default function HomePage() {
  const { profile, loading, error } = useProfileSummary()
  const {
    data: dashboardData,
    loading: dashboardLoading,
  } = useDashboardData()
  const navigate = useNavigate()

  return (
    <div>
      <SummarySection
        title="What MentorAI Knows About You"
        description="A personalized profile built from your conversations, resume, and progress to help MentorAI give more relevant guidance."
        profile={profile}
        loading={loading}
        error={error}
      />

      <PageHeader
        title="Welcome back!"
        description="Continue your interview prep journey. Pick up where you left off or explore something new."
      >
        <Button onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
          Start Mock Interview
        </Button>
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardLoading
          ? [0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-secondary" />
                  <div className="h-8 w-8 rounded-lg bg-secondary" />
                </div>
                <div className="h-8 w-20 rounded bg-secondary" />
                <div className="mt-3 h-3 w-24 rounded bg-secondary" />
              </div>
            ))
          : dashboardData?.stats?.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <StatCard
                  label={stat.label}
                  value={stat.value}
                  change={stat.change}
                  icon={statIcons[stat.id]}
                />
              </motion.div>
            ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <QuickActions stats={dashboardData?.stats} loading={dashboardLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecommendedInterviews dashboardData={dashboardData} loading={dashboardLoading} />
        <RecentActivity recentActivity={dashboardData?.recentActivity} loading={dashboardLoading} />
      </div>
    </div>
  )
}
