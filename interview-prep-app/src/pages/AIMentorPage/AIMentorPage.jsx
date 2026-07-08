import { useState } from 'react'
import { mentorMessages } from '../../data/mentorMessages'
import { Card, PageHeader } from '../../components/ui'
import ChatMessages from './ChatMessages'
import SuggestionChips from './SuggestionChips'
import ChatInput from './ChatInput'

function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function AIMentorPage() {
  const [messages, setMessages] = useState(mentorMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = async (content) => {
    const userMessage = {
      id: String(Date.now()),
      role: 'user',
      content,
      timestamp: getTimestamp(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/get_model_response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_prompt: content,
          }),
        }
      )

      const data = await response.json()

      const assistantMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.response, 
        timestamp: getTimestamp(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error(error)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-8rem)] flex-col">
      <PageHeader
        title="AI Mentor"
        description="Get personalized interview coaching, practice answers, and expert tips."
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-6 whitespace-pre-line">
          <ChatMessages messages={messages} isTyping={isTyping} />

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <SuggestionChips
              onSelect={sendMessage}
              disabled={isTyping}
            />

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={isTyping}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}