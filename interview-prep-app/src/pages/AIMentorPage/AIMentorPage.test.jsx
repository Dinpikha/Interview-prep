import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AIMentorPage from './AIMentorPage'
import ChatInput from './ChatInput'

const mentorState = vi.hoisted(() => ({
  value: null,
}))

vi.mock('../../context/MentorChatContext', () => ({
  useMentorChat: () => mentorState.value,
}))

function defaultMentorContext(overrides = {}) {
  return {
    messages: [],
    input: '',
    setInput: vi.fn(),
    isTyping: false,
    webSearchEnabled: false,
    setWebSearchEnabled: vi.fn(),
    sendMessage: vi.fn(),
    stopResponse: vi.fn(),
    respondingMessageId: null,
    handlePartialResponse: vi.fn(),
    finishResponse: vi.fn(),
    markMessageAnimated: vi.fn(),
    startNewChat: vi.fn(),
    ...overrides,
  }
}

describe('AIMentorPage', () => {
  it('shows the new conversation starting screen without the old intro bubble', () => {
    mentorState.value = defaultMentorContext()

    render(<AIMentorPage />)

    expect(screen.getByText(/what would you like to work on today/i)).toBeInTheDocument()
    expect(screen.getByText('Practice Next')).toBeInTheDocument()
    expect(screen.queryByText(/i'm your ai interview mentor/i)).not.toBeInTheDocument()
  })

  it('sends the existing chat prompt when a quick action is clicked', async () => {
    const user = userEvent.setup()
    const sendMessage = vi.fn()
    mentorState.value = defaultMentorContext({ sendMessage })

    render(<AIMentorPage />)
    await user.click(screen.getByRole('button', { name: /resume review/i }))

    expect(sendMessage).toHaveBeenCalledWith(
      'Review my resume feedback and tell me the highest-impact improvements.',
    )
  })

  it('renders conversation messages after chat begins', () => {
    mentorState.value = defaultMentorContext({
      messages: [
        { id: '1', role: 'user', content: 'Help me practice SQL', timestamp: '9:00 AM' },
        { id: '2', role: 'assistant', content: 'Start with joins and indexing.', timestamp: '9:01 AM' },
      ],
    })

    render(<AIMentorPage />)

    expect(screen.queryByText(/what would you like to work on today/i)).not.toBeInTheDocument()
    expect(screen.getByText(/help me practice sql/i)).toBeInTheDocument()
    expect(screen.getByText(/start with joins and indexing/i)).toBeInTheDocument()
  })
})

describe('ChatInput voice input', () => {
  it('shows unsupported browser feedback when speech recognition is unavailable', () => {
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition

    render(
      <ChatInput
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
        disabled={false}
        isResponding={false}
        onStop={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    )

    expect(screen.getByText(/voice input is not supported/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeDisabled()
  })

  it('starts listening and writes final transcript into the input', async () => {
    const user = userEvent.setup()
    let recognitionInstance
    class FakeSpeechRecognition {
      constructor() {
        recognitionInstance = this
      }
      start = vi.fn()
      stop = vi.fn()
    }
    window.SpeechRecognition = FakeSpeechRecognition
    const onChange = vi.fn()

    render(
      <ChatInput
        value=""
        onChange={onChange}
        onSend={vi.fn()}
        disabled={false}
        isResponding={false}
        onStop={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /start voice input/i }))
    expect(screen.getByText(/listening/i)).toBeInTheDocument()

    act(() => recognitionInstance.onresult({
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'practice SQL joins' },
          isFinal: true,
          length: 1,
        },
      ],
    }))

    expect(onChange).toHaveBeenCalledWith('practice SQL joins')
  })
})
