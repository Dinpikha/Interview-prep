import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Expand,
  Loader2,
  Mic,
  SkipForward,
  Square,
  Trophy,
} from 'lucide-react'
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
import {
  completeMockInterview,
  scoreMockAnswer,
  skipMockQuestion,
  startMockInterview,
  transcribeMockAnswer,
} from '../../lib/api'
import { getUserId } from '../../lib/tokenStorage'

const difficultyVariant = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'danger',
}

function formatStopwatch(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function isCodeQuestion(question, interviewType) {
  const haystack = [
    interviewType,
    question?.question_type,
    question?.related_skill,
    question?.question_text,
  ].join(' ').toLowerCase()

  return ['coding', 'code', 'algorithm', 'data structure', 'javascript', 'python', 'implement'].some((term) =>
    haystack.includes(term),
  )
}

export default function InterviewSession({ interview, onExit }) {
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedbackByQuestion, setFeedbackByQuestion] = useState({})
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [skippedQuestions, setSkippedQuestions] = useState({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [fullscreenWarning, setFullscreenWarning] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const currentQuestion = questions[currentIndex]
  const currentIsCode = isCodeQuestion(currentQuestion, interview.interview_type)
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(feedbackByQuestion).length
  const skippedCount = Object.keys(skippedQuestions).length

  useEffect(() => {
    let cancelled = false

    async function startSession() {
      try {
        setLoading(true)
        const data = await startMockInterview({
          user_id: getUserId(),
          interview_type: interview.interview_type,
          difficulty: interview.difficulty,
          question_count: interview.questions,
        })
        if (cancelled) return
        setSession(data.session)
        setQuestions(data.questions || [])
        setElapsedSeconds(0)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to start this interview.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    startSession()

    return () => {
      cancelled = true
      mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop())
    }
  }, [interview])

  useEffect(() => {
    if (summary || !currentQuestion) return
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [currentQuestion?.mock_question_id, summary, currentQuestion])

  useEffect(() => {
    async function enterFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
        setFullscreenWarning(false)
      } catch (err) {
        console.warn('Fullscreen request failed:', err)
        setFullscreenWarning(true)
      }
    }

    enterFullscreen()

    const handleFullscreenChange = () => {
      setFullscreenWarning(!document.fullscreenElement && !summary)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [summary])

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreenWarning(false)
    } catch (err) {
      setError(err?.message || 'Unable to enter fullscreen.')
    }
  }

  const currentFeedback = currentQuestion ? feedbackByQuestion[currentQuestion.mock_question_id] : null
  const canSubmit = answer.trim() && currentQuestion && !currentFeedback && !scoring

  const handleSubmitAnswer = async () => {
    if (!canSubmit) return
    setScoring(true)
    setError(null)

    try {
      const data = await scoreMockAnswer({
        user_id: getUserId(),
        mock_interview_id: session.mock_interview_id,
        mock_question_id: currentQuestion.mock_question_id,
        answer_text: answer.trim(),
      })
      setFeedbackByQuestion((prev) => ({
        ...prev,
        [currentQuestion.mock_question_id]: data.score,
      }))
    } catch (err) {
      setError(err?.message || 'Unable to score this answer.')
    } finally {
      setScoring(false)
    }
  }

  const handleNext = async () => {
    setAnswer('')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setElapsedSeconds(0)
      return
    }

    try {
      setLoading(true)
      const data = await completeMockInterview(session.mock_interview_id)
      setSummary(data)
    } catch (err) {
      setError(err?.message || 'Unable to complete this interview.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!currentQuestion || currentFeedback || skippedQuestions[currentQuestion.mock_question_id]) return
    setError(null)
    try {
      await skipMockQuestion({
        mock_interview_id: session.mock_interview_id,
        mock_question_id: currentQuestion.mock_question_id,
      })
      setSkippedQuestions((prev) => ({ ...prev, [currentQuestion.mock_question_id]: true }))
      setAnswer('')
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1)
        setElapsedSeconds(0)
      } else {
        setLoading(true)
        const data = await completeMockInterview(session.mock_interview_id)
        setSummary(data)
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
      setError(err?.message || 'Unable to skip this question.')
    }
  }

  const handleEndInterview = async () => {
    if (!session?.mock_interview_id || loading) return
    setError(null)
    setLoading(true)
    try {
      const data = await completeMockInterview(session.mock_interview_id)
      setSummary(data)
    } catch (err) {
      setError(err?.message || 'Unable to end this interview.')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      setRecording(false)
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      try {
        const data = await transcribeMockAnswer(blob)
        setAnswer((prev) => [prev, data.text].filter(Boolean).join('\n\n'))
      } catch (err) {
        setError(err?.message || 'Unable to transcribe this recording.')
      }
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const averageScore = useMemo(() => {
    const scores = Object.values(feedbackByQuestion).map((item) => item.score)
    return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
  }, [feedbackByQuestion])

  if (loading && !summary && !questions.length) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="workspace-card">
          <CardContent className="flex items-center gap-3 pt-6 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating fresh interview questions...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (summary) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="h-4 w-4" />
          Back to interviews
        </Button>

        <Card className="workspace-card">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <Trophy className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Session complete</h2>
                <p className="text-sm text-muted">Overall score: {summary.overall_score}/100</p>
              </div>
            </div>
            <ProgressBar label="Average score" value={summary.overall_score} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((question, index) => {
            const feedback = feedbackByQuestion[question.mock_question_id]
            const wasSkipped = skippedQuestions[question.mock_question_id]
            return (
              <Card key={question.mock_question_id}>
                <CardContent className="space-y-3 pt-6">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {question.question_text}
                  </p>
                  {wasSkipped ? (
                    <Badge variant="warning">Skipped</Badge>
                  ) : feedback && (
                    <>
                      <Badge variant="primary">{feedback.score}/100</Badge>
                      <p className="text-sm text-muted">{feedback.feedback}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-3xl border border-border bg-card/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Badge variant="primary">{answeredCount}/{questions.length} scored</Badge>
            {skippedCount > 0 && <Badge variant="warning">{skippedCount} skipped</Badge>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/50 px-4 py-2 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Question time
          </p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{formatStopwatch(elapsedSeconds)}</p>
        </div>
        </div>
      </div>

      {fullscreenWarning && (
        <motion.div
          className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>Fullscreen was exited. Re-enter fullscreen to continue the focused interview session.</span>
          <Button variant="outline" size="sm" onClick={requestFullscreen}>
            <Expand className="h-4 w-4" />
            Re-enter
          </Button>
        </motion.div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <ProgressBar
        value={progress}
        label={`Question ${currentIndex + 1} of ${questions.length}`}
        className="mb-6"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion?.mock_question_id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Card className="workspace-card mb-6">
            <CardHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">{currentQuestion?.question_type}</Badge>
                  <Badge variant="accent">{currentQuestion?.related_skill}</Badge>
                </div>
                <CardTitle className="text-base leading-relaxed">
                  {currentQuestion?.question_text}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {currentIsCode ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Your code</label>
                  <div className="overflow-hidden rounded-lg border border-border bg-background">
                    <CodeMirror
                      value={answer}
                      height="260px"
                      extensions={[javascript({ jsx: true })]}
                      theme={oneDark}
                      editable={!currentFeedback}
                      onChange={setAnswer}
                      basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: true,
                        autocompletion: false,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <Textarea
                  label="Your answer"
                  placeholder="Type your response here, or record and transcribe an answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={Boolean(currentFeedback)}
                  className="min-h-40"
                />
              )}

              <div className="flex flex-wrap gap-2">
                {!currentIsCode && (recording ? (
                  <Button variant="outline" onClick={stopRecording}>
                    <Square className="h-4 w-4 fill-current" />
                    Stop recording
                  </Button>
                ) : (
                  <Button variant="outline" onClick={startRecording} disabled={Boolean(currentFeedback)}>
                    <Mic className="h-4 w-4" />
                    Record answer
                  </Button>
                ))}
                <Button onClick={handleSubmitAnswer} disabled={!canSubmit}>
                  {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Score Answer
                </Button>
                <Button variant="ghost" onClick={handleSkip} disabled={Boolean(currentFeedback) || loading || scoring}>
                  <SkipForward className="h-4 w-4" />
                  Skip Question
                </Button>
                <Button variant="outline" onClick={handleEndInterview} disabled={loading || scoring}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  End Interview
                </Button>
              </div>

              {currentFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">Feedback</p>
                    <Badge variant="primary">{currentFeedback.score}/100</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{currentFeedback.feedback}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-medium text-success">Strengths</p>
                      <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
                        {currentFeedback.strengths?.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-warning">Improve</p>
                      <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
                        {currentFeedback.weaknesses?.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Running score: {averageScore}/100</p>
        <Button onClick={handleNext} disabled={!currentFeedback || loading}>
          {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
