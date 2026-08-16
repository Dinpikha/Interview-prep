import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Square } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import WebSearchToggle from './WebSearchToggle'

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isResponding,
  onStop,
  webSearchEnabled,
  onToggleWebSearch,
}) {
  const [speechSupported] = useState(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  )
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef(null)
  const latestValueRef = useRef(value)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finalText += transcript
        else interimText += transcript
      }

      if (finalText.trim()) {
        const nextValue = [latestValueRef.current, finalText.trim()].filter(Boolean).join(' ')
        onChange(nextValue)
        latestValueRef.current = nextValue
      }
      setInterimTranscript(interimText.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimTranscript('')
    }
    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => recognition.stop()
  }, [onChange])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (value.trim() && !disabled) {
      onSend(value.trim())
    }
  }

  const toggleListening = () => {
    if (!speechSupported || disabled) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      recognitionRef.current?.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  return (
    <div className="space-y-1.5">
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/10 transition-colors focus-within:border-primary/40 sm:gap-2"
    >
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
        wrapperClassName="min-w-0 flex-1"
        className="h-11 border-0 bg-transparent px-2 focus-visible:ring-0"
      />
      <Button
        type="button"
        variant={isListening ? 'primary' : 'outline'}
        size="md"
        onClick={toggleListening}
        disabled={disabled || !speechSupported}
        title={speechSupported ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Voice input is not supported in this browser'}
        aria-pressed={isListening}
        className="shrink-0"
      >
        <Mic className={isListening ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
        <span className="sr-only">{isListening ? 'Stop voice input' : 'Start voice input'}</span>
      </Button>
      {isResponding ? (
        <Button type="button" variant="outline" size="md" onClick={onStop} className="shrink-0">
          <Square className="h-4 w-4 fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </Button>
      ) : (
        <Button type="submit" size="md" disabled={disabled || !value.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      )}
    </form>
    {isListening && (
      <p className="px-2 text-xs text-accent">
        Listening{interimTranscript ? `: ${interimTranscript}` : '...'}
      </p>
    )}
    {!speechSupported && (
      <p className="px-2 text-xs text-muted-foreground">
        Voice input is not supported in this browser.
      </p>
    )}
    </div>
  )
}
