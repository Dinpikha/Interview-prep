import { useNavigate } from 'react-router-dom'
import { Flame, Target, TrendingUp, Trophy } from 'lucide-react'
import { dashboardStats } from '../../data/dashboardStats'
import { ROUTES } from '../../constants/routes'
import { Button, PageHeader, StatCard } from '../../components/ui'
import QuickActions from './QuickActions'
import RecentActivity from './RecentActivity'
import RecommendedInterviews from './RecommendedInterviews'

const statIcons = {
  interviews: Trophy,
  score: TrendingUp,
  streak: Flame,
  resumes: Target,
}

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Welcome back!"
        description="Continue your interview prep journey. Pick up where you left off or explore something new."
      >
        <Button onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
          Start Mock Interview
        </Button>
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={statIcons[stat.id]}
          />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecommendedInterviews />
        <RecentActivity />
      </div>
    </div>
  )
}
