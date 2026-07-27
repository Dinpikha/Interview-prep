import { useEffect, useRef, useState } from 'react'
import ChatMessage from './ChatMessage'
// useState

export default function ChatMessages({ messages, isTyping }) {
  const bottomRef = useRef(null)
  const [skipAnimation, setSkipAnimation] = useState(false)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-1 py-4">
      {messages.map((message) => (
       <ChatMessage
    message={message}
    shouldAnimate={
        message.id === currentlyAnimatingId
    }
/>
      ))}

      {isTyping && (
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
            </span>
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
