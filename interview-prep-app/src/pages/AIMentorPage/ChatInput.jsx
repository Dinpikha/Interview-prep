import { Send } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import WebSearchToggle from './WebSearchToggle'

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  webSearchEnabled,
  onToggleWebSearch,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()

    if (value.trim() && !disabled) {
      onSend(value.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <WebSearchToggle
        enabled={webSearchEnabled}
        onToggle={onToggleWebSearch}
        disabled={disabled}
      />
      <Input
        placeholder="Ask your AI mentor anything..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        wrapperClassName="flex-1"
        className="h-11"
      />
      <Button type="submit" size="lg" disabled={disabled || !value.trim()}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}