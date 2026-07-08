import { Clock, HelpCircle } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui'

const difficultyVariant = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

const statusVariant = {
  available: 'primary',
  completed: 'success',
}

export default function InterviewCard({ interview, onStart }) {
  const isCompleted = interview.status === 'completed'

  return (
    <Card className="flex flex-col transition-colors hover:border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{interview.title}</CardTitle>
          <Badge variant={statusVariant[interview.status]}>
            {isCompleted ? 'Completed' : 'Available'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <Badge variant={difficultyVariant[interview.difficulty]}>
          {interview.difficulty}
        </Badge>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {interview.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            {interview.questions} questions
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCompleted ? 'outline' : 'primary'}
          onClick={() => onStart(interview)}
        >
          {isCompleted ? 'Review Session' : 'Start Interview'}
        </Button>
      </CardFooter>
    </Card>
  )
}
