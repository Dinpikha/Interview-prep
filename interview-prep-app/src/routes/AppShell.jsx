import { AppLayout } from '../components/layout'
import ProtectedRoute from './ProtectedRoute'

export default function AppShell() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  )
}