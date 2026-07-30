import { useNavigate } from 'react-router-dom'
import { Bot, FileText, LayoutDashboard, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui'

const quickActions = [
  {
    title: 'Mock Interview',
    description: 'Practice with timed, role-specific interview sessions.',
    icon: Mic,
    path: ROUTES.MOCK_INTERVIEW,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Resume Analyzer',
    description: 'Get instant feedback on your resume structure and keywords.',
    icon: FileText,
    path: ROUTES.RESUME_ANALYZER,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    title: 'AI Mentor',
    description: 'Chat with your AI coach for personalized interview tips.',
    icon: Bot,
    path: ROUTES.AI_MENTOR,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    title: 'Dashboard',
    description: 'View your progress, scores, and practice history.',
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
]

export default function QuickActions({ stats = [], loading = false }) {
  const navigate = useNavigate()
  const statsById = Object.fromEntries((stats || []).map((stat) => [stat.id, stat.value]))

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {quickActions.map(({ title, description, icon: Icon, path, color, bg }, index) => (
        <motion.button
          key={title}
          type="button"
          onClick={() => navigate(path)}
          className="h-full text-left"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -2 }}
        >
          <Card className="flex h-full min-h-44 flex-col transition-colors hover:border-primary/30">
            <CardHeader className="flex h-full flex-col gap-5 p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {!loading && title === 'Mock Interview' && statsById.interviews != null && (
                  <span className="text-xs font-medium text-muted">{statsById.interviews} completed</span>
                )}
                {!loading && title === 'Dashboard' && statsById.sessions != null && (
                  <span className="text-xs font-medium text-muted">{statsById.sessions} sessions</span>
                )}
              </div>
              <div className="space-y-2">
                <CardTitle>{title}</CardTitle>
                <CardDescription className="leading-relaxed">{description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </motion.button>
      ))}
    </div>
  )
}
