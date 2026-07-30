import { memo, useEffect, useMemo, useState } from 'react'
import { Bot, User } from 'lucide-react'
import { cn } from '../../lib/cn'

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function parseTable(lines, startIndex) {
  if (!lines[startIndex]?.includes('|') || !isTableSeparator(lines[startIndex + 1] || '')) {
    return null
  }

  const rows = []
  let index = startIndex
  while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
    if (!isTableSeparator(lines[index])) {
      rows.push(
        lines[index]
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim()),
      )
    }
    index += 1
  }

  return { rows, nextIndex: index }
}

function MarkdownContent({ content }) {
  const lines = content.split('\n')
  const blocks = []
  let textBuffer = []
  let index = 0

  const flushText = () => {
    if (!textBuffer.length) return
    blocks.push({ type: 'text', content: textBuffer.join('\n') })
    textBuffer = []
  }

  while (index < lines.length) {
    const table = parseTable(lines, index)
    if (table) {
      flushText()
      blocks.push({ type: 'table', rows: table.rows })
      index = table.nextIndex
    } else {
      textBuffer.push(lines[index])
      index += 1
    }
  }
  flushText()

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'table') {
          const [header = [], ...rows] = block.rows

          return (
            <div key={blockIndex} className="max-w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead className="bg-secondary/80 text-foreground">
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th key={cellIndex} className="border-b border-border px-3 py-2 font-semibold">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-background even:bg-secondary/30">
                      {header.map((_, cellIndex) => (
                        <td key={cellIndex} className="border-t border-border px-3 py-2 text-muted">
                          {row[cellIndex] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {block.content}
          </p>
        )
      })}
    </div>
  )
}

function ChatMessage({ message, shouldAnimate, onPartialChange, onAnimationComplete }) {
  const isUser = message.role === 'user'

  const [count, setCount] = useState(() => (shouldAnimate ? 0 : message.content.length))
  const displayedText = useMemo(
    () => (shouldAnimate ? message.content.slice(0, count) : message.content),
    [count, message.content, shouldAnimate],
  )

  useEffect(() => {
    if (!shouldAnimate) return
    onPartialChange?.(message.id, displayedText)

    if (count < message.content.length) {
      const timer = setTimeout(() => {
        setCount((prev) => Math.min(prev + 4, message.content.length))
      }, 16)
      return () => clearTimeout(timer)
    } else {
      onAnimationComplete?.(message.id)
    }
  }, [count, displayedText, message.content, shouldAnimate, message.id, onAnimationComplete, onPartialChange])

  return (
    <div className={cn('group flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-border',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={cn('max-w-[86%] space-y-1', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow group-hover:shadow-md',
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : message.tone === 'error'
                ? 'rounded-tl-md border border-danger/30 bg-danger/5 text-danger'
                : 'rounded-tl-md border border-border bg-card text-foreground',
          )}>
            {isUser ? message.content : <MarkdownContent content={displayedText} />}
          </div>
      
          
          
        
        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
      </div>
    </div>
  )
}

export default memo(ChatMessage)
