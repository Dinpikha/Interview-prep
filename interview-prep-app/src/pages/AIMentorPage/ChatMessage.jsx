import { memo, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, ExternalLink, User } from 'lucide-react'
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

function renderInline(text) {
  const parts = []
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|https?:\/\/[^\s)]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
      parts.push(
        <motion.a
          key={`${match.index}-link`}
          href={linkMatch?.[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent underline-offset-2 hover:underline"
          whileHover={{ y: -1 }}
        >
          {linkMatch?.[1] || token}
        </motion.a>,
      )
    } else if (token.startsWith('http')) {
      const cleanUrl = token.replace(/[.,;:!?]+$/, '')
      const trailing = token.slice(cleanUrl.length)
      parts.push(
        <motion.a
          key={`${match.index}-url`}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent underline-offset-2 transition-colors hover:text-foreground hover:underline"
          initial={{ opacity: 0.88 }}
          animate={{ opacity: 1 }}
          whileHover={{ y: -1 }}
        >
          {cleanUrl}
        </motion.a>,
      )
      if (trailing) parts.push(trailing)
    } else if (token.startsWith('**')) {
      parts.push(
        <strong key={`${match.index}-bold`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*')) {
      parts.push(
        <em key={`${match.index}-italic`} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    } else {
      parts.push(
        <code key={`${match.index}-code`} className="rounded bg-secondary px-1 py-0.5 text-[0.92em] text-accent">
          {token.slice(1, -1)}
        </code>,
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function RichText({ content }) {
  const lines = content.split('\n')
  const elements = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      elements.push(
        <p key={index} className="text-sm font-semibold text-foreground">
          {renderInline(heading[2])}
        </p>,
      )
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      elements.push(
        <ul key={index} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index += 1
      }
      elements.push(
        <ol key={index} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const paragraph = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }

    elements.push(
      <p key={index} className="whitespace-pre-wrap">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
  }

  return <div className="space-y-2.5">{elements}</div>
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
              <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
                <thead className="bg-secondary/80 text-foreground">
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th key={cellIndex} className="border-b border-border px-3 py-2 font-semibold">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-background even:bg-secondary/30">
                      {header.map((_, cellIndex) => (
                        <td key={cellIndex} className="border-t border-border px-3 py-2 text-muted">
                          {renderInline(row[cellIndex] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <RichText key={blockIndex} content={block.content} />
      })}
    </div>
  )
}

function removeDuplicateSourceSection(content, sources) {
  if (!sources?.length) return content

  const lines = content.split('\n')
  const sourceHeadingIndex = lines.findLastIndex((line) =>
    /^\s*(#{1,6}\s*)?(sources|references)\s*:?\s*$/i.test(line.trim()),
  )

  if (sourceHeadingIndex === -1) return content

  const trailingLines = lines.slice(sourceHeadingIndex + 1)
  const hasUrlList = trailingLines.some((line) => /https?:\/\/|\[[^\]]+\]\(https?:\/\//.test(line))

  return hasUrlList ? lines.slice(0, sourceHeadingIndex).join('\n').trim() : content
}

function ChatMessage({ message, shouldAnimate, onPartialChange, onAnimationComplete }) {
  const isUser = message.role === 'user'
  const cleanContent = useMemo(
    () => removeDuplicateSourceSection(message.content, message.sources),
    [message.content, message.sources],
  )

  const [count, setCount] = useState(() => (shouldAnimate ? 0 : cleanContent.length))
  const displayedText = useMemo(
    () => (shouldAnimate ? cleanContent.slice(0, count) : cleanContent),
    [cleanContent, count, shouldAnimate],
  )

  useEffect(() => {
    if (!shouldAnimate) return
    onPartialChange?.(message.id, displayedText)

    if (count < cleanContent.length) {
      const timer = setTimeout(() => {
        setCount((prev) => Math.min(prev + 4, cleanContent.length))
      }, 16)
      return () => clearTimeout(timer)
    } else {
      onAnimationComplete?.(message.id)
    }
  }, [cleanContent, count, displayedText, shouldAnimate, message.id, onAnimationComplete, onPartialChange])

  return (
    <motion.div
      className={cn('group mx-auto flex w-full max-w-4xl min-w-0 gap-2 sm:gap-3', isUser && 'flex-row-reverse')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-border',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent/10 text-accent',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={cn('min-w-0 max-w-[calc(100%-3rem)] space-y-1.5 sm:max-w-[min(82%,760px)]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block max-w-full overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow [overflow-wrap:anywhere] group-hover:shadow-md',
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : message.tone === 'error'
                ? 'rounded-tl-md border border-danger/30 bg-danger/5 text-danger'
                : 'rounded-tl-md border border-border bg-card text-foreground',
          )}
        >
          {isUser ? message.content : <MarkdownContent content={displayedText} />}
        </div>

        {!isUser && message.sources?.length > 0 && !shouldAnimate && (
          <div className="mt-3 max-w-full space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sources</p>
            <div className="flex max-w-full flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <motion.a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:text-foreground"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1 }}
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{source.title || source.url}</span>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
      </div>
    </motion.div>
  )
}

export default memo(ChatMessage)
