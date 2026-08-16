import { BarChart3, Brain, FileText, RotateCcw, Sparkles, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button, Card, CardContent } from '../../components/ui'
import { useMentorChat } from '../../context/MentorChatContext'
import ChatMessages from './ChatMessages'
import SuggestionChips from './SuggestionChips'
import ChatInput from './ChatInput'

const mentorActions = [
  {
    title: 'Practice Next',
    description: 'Find the most important area to work on.',
    icon: Target,
    prompt: 'Based on my progress, what should I practice next and why?',
  },
  {
    title: 'Resume Review',
    description: 'Get feedback based on my resume.',
    icon: FileText,
    prompt: 'Review my resume feedback and tell me the highest-impact improvements.',
  },
  {
    title: 'Analyze My Progress',
    description: 'Understand my strengths and weak areas.',
    icon: BarChart3,
    prompt: 'Analyze my interview preparation progress, strengths, and weak areas.',
  },
  {
    title: 'Interview Guidance',
    description: 'Ask about interviews, projects, preparation, or career decisions.',
    icon: Brain,
    prompt: 'Help me make a focused interview preparation plan for this week.',
  },
]

function MentorEmptyState({ onSelect, disabled }) {
  return (
    <div className="mx-auto w-full max-w-4xl py-6 md:py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Hey 👋 What would you like to work on today?
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Choose a starting point or ask your own question below. Your mentor will use the same chat session and preparation context.
        </p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
        {mentorActions.map(({ title, description, icon: Icon, prompt }, index) => (
          <motion.button
            key={title}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className="text-left disabled:opacity-60"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="subtle-lift h-full border-primary/10">
              <CardContent className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function AIMentorPage() {
  const {
    messages,
    input,
    setInput,
    isTyping,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    stopResponse,
    respondingMessageId,
    handlePartialResponse,
    finishResponse,
    markMessageAnimated,
    startNewChat,
  } = useMentorChat()

  const showIntro = messages.length === 0 && !isTyping

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-5xl flex-col overflow-x-clip">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              AI Mentor
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Personalized guidance based on your interview preparation.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={startNewChat} disabled={isTyping}>
          <RotateCcw className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {showIntro ? (
          <MentorEmptyState onSelect={sendMessage} disabled={isTyping} />
        ) : (
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            respondingMessageId={respondingMessageId}
            onPartialResponse={handlePartialResponse}
            onResponseComplete={finishResponse}
            onMessageAnimated={markMessageAnimated}
          />
        )}

        <div className="sticky bottom-0 mt-auto min-w-0 space-y-3 bg-background/85 pb-2 pt-4 backdrop-blur-xl">
          <SuggestionChips onSelect={sendMessage} disabled={isTyping} />

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            disabled={isTyping}
            isResponding={isTyping}
            onStop={stopResponse}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={setWebSearchEnabled}
          />
        </div>
      </div>
    </div>
  )
}
