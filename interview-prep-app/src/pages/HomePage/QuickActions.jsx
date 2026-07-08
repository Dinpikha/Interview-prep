import { useNavigate } from 'react-router-dom'
import { Bot, FileText, LayoutDashboard, Mic } from 'lucide-react'
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

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quickActions.map(({ title, description, icon: Icon, path, color, bg }) => (
        <button
          key={title}
          type="button"
          onClick={() => navigate(path)}
          className="text-left"
        >
          <Card className="h-full transition-colors hover:border-primary/30">
            <CardHeader>
              <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        </button>
      ))}
    </div>
  )
}
