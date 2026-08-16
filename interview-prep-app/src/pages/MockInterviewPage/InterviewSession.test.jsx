import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InterviewSession from './InterviewSession'

vi.mock('../../lib/tokenStorage', () => ({
  getUserId: () => 'user-1',
}))

vi.mock('../../lib/api', () => ({
  startMockInterview: vi.fn().mockResolvedValue({
    session: { mock_interview_id: 'mock-1' },
    questions: [
      {
        mock_question_id: 'q-1',
        question_text: 'Explain FastAPI dependency injection.',
        question_type: 'technical',
        related_skill: 'FastAPI',
      },
    ],
  }),
  scoreMockAnswer: vi.fn().mockResolvedValue({
    score: {
      score: 88,
      strengths: ['Clear explanation'],
      weaknesses: ['Add an example'],
      feedback: 'Good answer.',
    },
  }),
  completeMockInterview: vi.fn().mockResolvedValue({
    overall_score: 88,
    questions: [],
  }),
  skipMockQuestion: vi.fn(),
  transcribeMockAnswer: vi.fn(),
}))

describe('InterviewSession', () => {
  it('loads a question, scores an answer, and shows completion', async () => {
    const user = userEvent.setup()
    render(
      <InterviewSession
        interview={{
          title: 'Backend Practice',
          interview_type: 'technical',
          difficulty: 'Intermediate',
          questions: 1,
        }}
        onExit={vi.fn()}
      />,
    )

    expect(screen.getByText(/generating fresh interview questions/i)).toBeInTheDocument()
    expect(await screen.findByText(/explain fastapi dependency injection/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/your answer/i), 'FastAPI dependencies inject reusable services.')
    await user.click(screen.getByRole('button', { name: /score answer/i }))

    expect(await screen.findByText(/good answer/i)).toBeInTheDocument()
    expect(screen.getAllByText(/88\/100/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /finish interview/i }))

    await waitFor(() => {
      expect(screen.getByText(/session complete/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/overall score: 88\/100/i)).toBeInTheDocument()
  })
})
