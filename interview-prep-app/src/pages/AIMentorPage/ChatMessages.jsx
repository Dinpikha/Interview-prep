import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ChatMessage from './ChatMessage'

export default function ChatMessages({
  messages,
  isTyping,
  respondingMessageId,
  onPartialResponse,
  onResponseComplete,
  onMessageAnimated,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  const lastMessage = messages[messages.length - 1]
  const currentlyAnimatingId =
    lastMessage && lastMessage.role !== 'user' && lastMessage.animate
      ? lastMessage.id
      : null

  const handleAnimationComplete = useCallback((id) => {
    onMessageAnimated?.(id)
    onResponseComplete?.(id)
  }, [onMessageAnimated, onResponseComplete])

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-1 py-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          shouldAnimate={
            message.id === currentlyAnimatingId || (message.id === respondingMessageId && message.animate)
          }
          onPartialChange={onPartialResponse}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}

      <AnimatePresence>
        {isTyping && !respondingMessageId && (
          <motion.div
            className="flex min-h-8 gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted">
              <span className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-muted"
                    animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: dot * 0.12 }}
                  />
                ))}
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
