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
    <div className="grid gap-4 sm:grid-cols-2">
      {quickActions.map(({ title, description, icon: Icon, path, color, bg }, index) => (
        <motion.button
          key={title}
          type="button"
          onClick={() => navigate(path)}
          className="text-left"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -2 }}
        >
          <Card className="h-full transition-colors hover:border-primary/30">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {!loading && title === 'AI Mentor' && statsById.messages != null && (
                  <span className="text-xs font-medium text-muted">{statsById.messages} messages</span>
                )}
                {!loading && title === 'Dashboard' && statsById.sessions != null && (
                  <span className="text-xs font-medium text-muted">{statsById.sessions} sessions</span>
                )}
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        </motion.button>
      ))}
    </div>
  )
}
