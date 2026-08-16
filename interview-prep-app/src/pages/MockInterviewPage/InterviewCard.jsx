import { Clock, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui'

const difficultyVariant = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

const statusVariant = {
  available: 'primary',
}

export default function InterviewCard({ interview, onStart }) {
  const Icon = interview.icon

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.16 }}>
      <Card className="subtle-lift flex h-full flex-col transition-colors hover:border-primary/30">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {Icon && <Icon className="h-5 w-5" />}
            </span>
            <Badge variant={statusVariant[interview.status]}>
              Generated
            </Badge>
          </div>
          <div>
            <CardTitle>{interview.title}</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted">{interview.description}</p>
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
            variant="primary"
            onClick={() => onStart(interview)}
          >
            Start Interview
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
