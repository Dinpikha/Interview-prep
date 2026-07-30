import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Clock, FileText, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui'

function buildRecommendations(dashboardData) {
  const stats = Object.fromEntries((dashboardData?.stats || []).map((stat) => [stat.id, stat.value]))
  const hasScores = dashboardData?.performanceAreas?.length > 0
  const hasResume = Number(stats.resumes || 0) > 0
  const sessions = Number(stats.sessions || 0)

  if (!hasResume) {
    return [
      {
        id: 'resume',
        title: 'Analyze your resume',
        detail: 'Create a profile signal MentorAI can use for more targeted coaching.',
        badge: 'Next best step',
        variant: 'primary',
        icon: FileText,
        path: ROUTES.RESUME_ANALYZER,
      },
    ]
  }

  if (!hasScores) {
    return [
      {
        id: 'practice',
        title: 'Start a scored practice loop',
        detail: 'Record a few sessions so your dashboard can surface strengths and gaps.',
        badge: `${sessions} sessions`,
        variant: 'warning',
        icon: BarChart3,
        path: ROUTES.MOCK_INTERVIEW,
      },
    ]
  }

  const weakestArea = [...dashboardData.performanceAreas].sort((a, b) => a.score - b.score)[0]

  return [
    {
      id: 'mentor',
      title: `Work on ${weakestArea.label}`,
      detail: `Your current average is ${weakestArea.score}/100. Ask MentorAI for targeted drills.`,
      badge: 'Personalized',
      variant: 'success',
      icon: MessageSquare,
      path: ROUTES.AI_MENTOR,
    },
  ]
}

export default function RecommendedInterviews({ dashboardData, loading = false }) {
  const navigate = useNavigate()
  const recommended = buildRecommendations(dashboardData)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Recommended for You</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {loading ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="h-4 w-44 rounded bg-secondary" />
            <div className="mt-3 h-4 w-full rounded bg-secondary" />
            <div className="mt-2 h-4 w-2/3 rounded bg-secondary" />
          </div>
        ) : (
          recommended.map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-secondary/20 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={item.variant}>{item.badge}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        Based on live activity
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate(item.path)}>
                  Open
                </Button>
              </motion.div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
