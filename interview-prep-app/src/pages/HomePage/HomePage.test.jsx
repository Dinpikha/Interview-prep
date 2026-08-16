import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './HomePage'

const mockHooks = vi.hoisted(() => ({
  dashboard: null,
  profile: null,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'Dipika', user_id: 'user-1' } }),
}))

vi.mock('../../hooks', () => ({
  useDashboardData: () => mockHooks.dashboard,
  useProfileSummary: () => mockHooks.profile,
}))

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('renders supplied progress metrics and recommendation data', () => {
    mockHooks.dashboard = {
      loading: false,
      error: null,
      data: {
        success: true,
        stats: [
          { id: 'score', label: 'Interview Readiness', value: '76' },
          { id: 'sessions', label: 'Practice Sessions', value: '4' },
        ],
        performanceAreas: [
          { label: 'FastAPI', score: 82 },
          { label: 'SQL', score: 58 },
        ],
        weeklyProgress: [],
        scoreTrend: [],
        recentActivity: [{ label: 'Mock interview completed' }],
      },
    }
    mockHooks.profile = { profile: 'Knows backend and React work.', loading: false, error: null }

    renderHome()

    expect(screen.getByText(/Dipika/i)).toBeInTheDocument()
    expect(screen.getByText('76')).toBeInTheDocument()
    expect(screen.getByText('Practice Sessions')).toBeInTheDocument()
    expect(screen.getByText(/practice SQL/i)).toBeInTheDocument()
    expect(screen.getAllByText('FastAPI').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SQL').length).toBeGreaterThan(0)
  })

  it('shows data-unavailable empty states without inventing metrics', () => {
    mockHooks.dashboard = {
      loading: false,
      error: 'Unable to load dashboard data.',
      data: null,
    }
    mockHooks.profile = { profile: null, loading: false, error: null }

    renderHome()

    expect(screen.getByText(/progress data unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/no recommendation data is available yet/i)).toBeInTheDocument()
    expect(screen.queryByText('76')).not.toBeInTheDocument()
  })
})
