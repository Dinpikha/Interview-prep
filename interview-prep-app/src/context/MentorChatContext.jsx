import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { mentorMessages } from '../data/mentorMessages'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'

const MentorChatContext = createContext(null)

function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

async function createSession(user_id) {
  const data = await apiRequest('/create_session', {
    method: 'POST',
    body: JSON.stringify({ user_id }),
  })
  if (data?.success && data.session_id) {
    localStorage.setItem('session_id', data.session_id)
    return data.session_id
  }
  return null
}

export function MentorChatProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.user_id ?? null

  const [messages, setMessages] = useState(mentorMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [respondingMessageId, setRespondingMessageId] = useState(null)

  
  const sessionOwnerId = useRef(null)
  const abortControllerRef = useRef(null)
  const partialResponseRef = useRef({ id: null, content: '' })

  useEffect(() => {
   
    if (!userId) {
      if (sessionOwnerId.current !== null) {
        sessionOwnerId.current = null
        setSessionId(null)
        localStorage.removeItem('session_id')
      }
      return
    }

    
    if (sessionOwnerId.current === userId) return

    sessionOwnerId.current = userId
    createSession(userId)
      .then((id) => id && setSessionId(id))
      .catch((err) => console.error(err))
  }, [userId])

  const sendMessage = useCallback(
    async (content) => {
      if (!userId) {
        console.error('sendMessage called with no signed-in user')
        return
      }

      const userMessage = {
        id: String(Date.now()),
        role: 'user',
        content,
        timestamp: getTimestamp(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsTyping(true)
      setRespondingMessageId(null)
      partialResponseRef.current = { id: null, content: '' }
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const data = await apiRequest('/ai_mentor', {
          method: 'POST',
          signal: abortController.signal,
          body: JSON.stringify({
            user_prompt: content,
            web_search: webSearchEnabled,
            user_id: userId,
            session_id: sessionId,
            role: 'user',
          }),
        })

        const assistantMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: data.response,
          timestamp: getTimestamp(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setRespondingMessageId(assistantMessage.id)
        partialResponseRef.current = { id: assistantMessage.id, content: '' }
      } catch (err) {
        if (err?.name === 'AbortError') return
        console.error(err)
        const errorMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: err?.message || 'I could not reach MentorAI. Please try again.',
          timestamp: getTimestamp(),
          tone: 'error',
        }
        setMessages((prev) => [...prev, errorMessage])
        setRespondingMessageId(errorMessage.id)
      } finally {
        abortControllerRef.current = null
      }
    },
    [userId, sessionId, webSearchEnabled],
  )

  const handlePartialResponse = useCallback((id, content) => {
    partialResponseRef.current = { id, content }
  }, [])

  const finishResponse = useCallback((id) => {
    if (!id || id !== respondingMessageId) return
    partialResponseRef.current = { id: null, content: '' }
    setRespondingMessageId(null)
    setIsTyping(false)
  }, [respondingMessageId])

  const stopResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    const { id, content } = partialResponseRef.current
    if (id && content) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, content, stopped: true } : message,
        ),
      )
    }

    partialResponseRef.current = { id: null, content: '' }
    setRespondingMessageId(null)
    setIsTyping(false)
  }, [])


  const startNewChat = useCallback(async () => {
    if (!userId) {
      console.error('startNewChat called with no signed-in user')
      return
    }

    setMessages(mentorMessages)
    setInput('')
    setIsTyping(false)
    setRespondingMessageId(null)
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    partialResponseRef.current = { id: null, content: '' }

    try {
      const id = await createSession(userId)
      if (id) setSessionId(id)
    } catch (err) {
      console.error(err)
    }
  }, [userId])

  const value = {
    messages,
    input,
    setInput,
    isTyping,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    stopResponse,
    respondingMessageId,
    handlePartialResponse,
    finishResponse,
    startNewChat,
  }

  return <MentorChatContext.Provider value={value}>{children}</MentorChatContext.Provider>
}

export function useMentorChat() {
  const ctx = useContext(MentorChatContext)
  if (!ctx) throw new Error('useMentorChat must be used within a MentorChatProvider')
  return ctx
}
