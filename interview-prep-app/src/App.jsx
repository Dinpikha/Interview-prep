import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { MentorChatProvider } from './context/MentorChatContext'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MentorChatProvider>
          <RouterProvider router={router} />
        </MentorChatProvider>
      </ToastProvider>
    </AuthProvider>
  )
}