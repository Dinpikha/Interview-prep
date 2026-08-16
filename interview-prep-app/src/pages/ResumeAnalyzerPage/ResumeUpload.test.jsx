import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResumeUpload from './ResumeUpload'

describe('ResumeUpload', () => {
  it('keeps analyze disabled until a PDF is selected', async () => {
    const user = userEvent.setup()
    const onFileSelect = vi.fn()
    render(
      <ResumeUpload
        selectedFile={null}
        onFileSelect={onFileSelect}
        onAnalyze={vi.fn()}
        isAnalyzing={false}
      />,
    )

    expect(screen.getByRole('button', { name: /analyze resume/i })).toBeDisabled()

    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText(/drop your resume/i), file)

    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('shows selected file and triggers analyze', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(
      <ResumeUpload
        selectedFile={new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })}
        onFileSelect={vi.fn()}
        onAnalyze={onAnalyze}
        isAnalyzing={false}
      />,
    )

    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /analyze resume/i }))

    expect(onAnalyze).toHaveBeenCalled()
  })
})
