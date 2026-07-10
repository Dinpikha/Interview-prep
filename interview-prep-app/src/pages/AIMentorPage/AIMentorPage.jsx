import { RotateCcw } from 'lucide-react'
import { Button, Card, PageHeader } from '../../components/ui'
import { useMentorChat } from '../../context/MentorChatContext'
import ChatMessages from './ChatMessages'
import SuggestionChips from './SuggestionChips'
import ChatInput from './ChatInput'

export default function AIMentorPage() {
  const {
    messages,
    input,
    setInput,
    isTyping,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    startNewChat,
  } = useMentorChat()

  return (
    <div className="flex h-[calc(100svh-8rem)] flex-col">
      <PageHeader
        title="AI Mentor"
        description="Get personalized interview coaching, practice answers, and expert tips."
      >
        <Button variant="outline" size="sm" onClick={startNewChat} disabled={isTyping}>
          <RotateCcw className="h-4 w-4" />
          New Chat
        </Button>
      </PageHeader>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6 whitespace-pre-line">
          <ChatMessages messages={messages} isTyping={isTyping} />

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <SuggestionChips onSelect={sendMessage} disabled={isTyping} />

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={isTyping}
              webSearchEnabled={webSearchEnabled}
              onToggleWebSearch={setWebSearchEnabled}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}