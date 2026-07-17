import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlarmClock, ArrowLeft, ArrowRight, Clock, SkipForward, TimerReset } from 'lucide-react'
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
import { useCountdown, formatDuration, parseDurationToSeconds } from '../../hooks'

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

// Per-question time budget, clamped to something sane regardless of how
// long/short the overall session is.
const MIN_QUESTION_SECONDS = 60
const MAX_QUESTION_SECONDS = 240

export default function InterviewSession({ interview, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [autoSkipped, setAutoSkipped] = useState(false)
  const answeredRef = useRef(new Set())

  const totalQuestions = Math.min(interview.questions, placeholderQuestions.length)
  const currentQuestion = placeholderQuestions[currentIndex]
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  const sessionSeconds = useMemo(
    () => parseDurationToSeconds(interview.duration),
    [interview.duration],
  )
  const questionSeconds = useMemo(() => {
    const share = Math.floor(sessionSeconds / totalQuestions)
    return Math.min(MAX_QUESTION_SECONDS, Math.max(MIN_QUESTION_SECONDS, share))
  }, [sessionSeconds, totalQuestions])

  // ----- overall session countdown -----
  const session = useCountdown(sessionSeconds, {
    onExpire: () => onExit?.(),
  })

  // ----- per-question countdown -----
  const question = useCountdown(questionSeconds, {
    onExpire: () => {
      setAutoSkipped(true)
      goToNext({ auto: true })
    },
  })

  function goToNext({ auto = false } = {}) {
    if (!auto) setAutoSkipped(false)
    if (answer.trim()) answeredRef.current.add(currentIndex)

    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, totalQuestions - 1)
      return next
    })
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      goToNext()
      setAnswer('')
    } else {
      onExit?.()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setAutoSkipped(false)
      setCurrentIndex((prev) => prev - 1)
      setAnswer('')
    }
  }

  // Restart the per-question timer whenever we move to a new question.
  useEffect(() => {
    question.reset(questionSeconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questionSeconds])

  const questionUrgency =
    question.secondsLeft <= 10 ? 'danger' : question.secondsLeft <= questionSeconds * 0.3 ? 'warning' : 'normal'
  const sessionUrgency = session.secondsLeft <= 60 ? 'danger' : session.secondsLeft <= sessionSeconds * 0.15 ? 'warning' : 'normal'

  const urgencyText = {
    normal: 'text-foreground',
    warning: 'text-warning',
    danger: 'text-danger',
  }

  const questionProgressPct = (question.secondsLeft / questionSeconds) * 100

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

        <motion.div
          animate={sessionUrgency === 'danger' ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ repeat: sessionUrgency === 'danger' ? Infinity : 0, duration: 1 }}
          className={`rounded-lg border px-4 py-2 text-center transition-colors ${
            sessionUrgency === 'danger'
              ? 'border-danger/40 bg-danger/10'
              : sessionUrgency === 'warning'
                ? 'border-warning/40 bg-warning/10'
                : 'border-border bg-card'
          }`}
        >
          <p className="flex items-center justify-center gap-1 text-xs text-muted">
            <AlarmClock className="h-3.5 w-3.5" />
            Time remaining
          </p>
          <p className={`text-lg font-semibold tabular-nums ${urgencyText[sessionUrgency]}`}>
            {formatDuration(session.secondsLeft)}
          </p>
        </motion.div>
      </div>

      <ProgressBar
        value={progress}
        label={`Question ${currentIndex + 1} of ${totalQuestions}`}
        className="mb-6"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base leading-relaxed">
                  {currentQuestion}
                </CardTitle>

                <div
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
                    questionUrgency === 'danger'
                      ? 'border-danger/40 bg-danger/10 text-danger animate-pulse'
                      : questionUrgency === 'warning'
                        ? 'border-warning/40 bg-warning/10 text-warning'
                        : 'border-border bg-secondary text-muted'
                  }`}
                  title="Time left for this question"
                >
                  <TimerReset className="h-3.5 w-3.5" />
                  {formatDuration(question.secondsLeft)}
                </div>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={`h-full rounded-full ${
                    questionUrgency === 'danger'
                      ? 'bg-danger'
                      : questionUrgency === 'warning'
                        ? 'bg-warning'
                        : 'bg-primary'
                  }`}
                  animate={{ width: `${Math.max(0, questionProgressPct)}%` }}
                  transition={{ ease: 'linear', duration: 1 }}
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {autoSkipped && currentIndex > 0 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-3 text-xs font-medium text-warning"
                >
                  Time ran out on the previous question — moved on automatically.
                </motion.p>
              )}
              <Textarea
                label="Your answer"
                placeholder="Type your response here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-40"
              />
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

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
