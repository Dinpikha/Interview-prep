import { useState } from 'react'
import { ArrowLeft, ArrowRight, Clock, SkipForward } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ProgressBar,
  Textarea,
} from '../../components/ui'

const placeholderQuestions = [
  'Tell me about yourself and your experience with frontend development.',
  'Explain the difference between virtual DOM and real DOM. When does React re-render?',
  'Describe a challenging bug you fixed recently. What was your debugging process?',
  'How do you approach state management in a large React application?',
  'What is your experience with performance optimization in web applications?',
]

const difficultyVariant = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

export default function InterviewSession({ interview, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const totalQuestions = Math.min(interview.questions, placeholderQuestions.length)
  const currentQuestion = placeholderQuestions[currentIndex]
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
      setAnswer('')
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setAnswer('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
            Back to interviews
          </Button>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{interview.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={difficultyVariant[interview.difficulty]}>
              {interview.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted">
              <Clock className="h-4 w-4" />
              {interview.duration}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
          <p className="text-xs text-muted">Time remaining</p>
          <p className="text-lg font-semibold text-foreground">42:15</p>
        </div>
      </div>

      <ProgressBar
        value={progress}
        label={`Question ${currentIndex + 1} of ${totalQuestions}`}
        className="mb-6"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base leading-relaxed">
            {currentQuestion}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            label="Your answer"
            placeholder="Type your response here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-40"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="ghost" onClick={handleNext}>
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={handleNext}>
            Next Question
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onExit}>Finish Interview</Button>
        )}
      </div>
    </div>
  )
}
