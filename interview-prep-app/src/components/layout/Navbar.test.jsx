import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './Navbar'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'dipika' },
    logout: vi.fn(),
  }),
}))

function renderNavbar(initialPath = '/home') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('renders product navigation without a Dashboard item', () => {
    renderNavbar('/home')

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /mock interview/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /resume analyzer/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ai mentor/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
  })

  it('marks the current route as active', () => {
    renderNavbar('/resume-analyzer')

    expect(screen.getByRole('link', { name: /resume analyzer/i })).toHaveClass('bg-card')
  })

  it('opens mobile navigation from the menu button', async () => {
    const user = userEvent.setup()
    renderNavbar('/home')

    await user.click(screen.getByRole('button', { name: /open navigation/i }))

    expect(screen.getAllByRole('button', { name: /close navigation/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /ai mentor/i }).length).toBeGreaterThan(0)
  })
})
