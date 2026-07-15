import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { mentorMessages } from '../data/mentorMessages'
import { apiRequest } from '../lib/api'

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
    body: JSON.stringify({ user_id: user_id }),
  })
  if (data?.success && data.session_id) {
    localStorage.setItem('session_id', data.session_id)
    return data.session_id
  }
  return null
}

export function MentorChatProvider({ children }) {
  const [messages, setMessages] = useState(mentorMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('session_id'))
  const sessionCreated = useRef(false)


  useEffect(() => {
    if (sessionCreated.current || sessionId) return
    sessionCreated.current = true

    const user_id = localStorage.getItem('user_id')
    createSession(user_id)
      .then((id) => id && setSessionId(id))
      .catch((err) => console.error(err))
  }, [sessionId])

  const sendMessage = useCallback(
    async (content) => {
      const user_id = localStorage.getItem('user_id')

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
        const data = await apiRequest('/ai_mentor', {
          method: 'POST',
          body: JSON.stringify({
            user_prompt: content,
            web_search: webSearchEnabled,
            user_id: user_id,
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
      } catch (err) {
       
        console.error(err)
      } finally {
        setIsTyping(false)
      }
    },
    [sessionId, webSearchEnabled],
  )

  // The ONLY thing that should ever clear the conversation — wired to an
  // explicit "New Chat" button, never to navigation/unmount.
  const startNewChat = useCallback(async () => {
    const user_id = localStorage.getItem('user_id')
    setMessages(mentorMessages)
    setInput('')
    setIsTyping(false)

    try {
      const id = await createSession(user_id)
      if (id) setSessionId(id)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const value = {
    messages,
    input,
    setInput,
    isTyping,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    startNewChat,
  }

  return <MentorChatContext.Provider value={value}>{children}</MentorChatContext.Provider>
}

export function useMentorChat() {
  const ctx = useContext(MentorChatContext)
  if (!ctx) throw new Error('useMentorChat must be used within a MentorChatProvider')
  return ctx
}