import { Bot, User } from 'lucide-react'
import { cn } from '../../lib/cn'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={cn('max-w-[80%] space-y-1', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground',
          )}
        >
          {message.content}
        </div>
        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
      </div>
    </div>
  )
}
