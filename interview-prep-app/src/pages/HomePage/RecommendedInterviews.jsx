import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, HelpCircle } from 'lucide-react'
import { mockInterviews } from '../../data/mockInterviews'
import { ROUTES } from '../../constants/routes'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui'

const difficultyVariant = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

export default function RecommendedInterviews() {
  const navigate = useNavigate()
  const recommended = mockInterviews.filter((item) => item.status === 'available').slice(0, 2)

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
        {recommended.map((interview) => (
          <div
            key={interview.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{interview.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={difficultyVariant[interview.difficulty]}>
                  {interview.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  {interview.duration}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <HelpCircle className="h-3 w-3" />
                  {interview.questions} questions
                </span>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
              Start
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
