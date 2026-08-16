import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalysisResults from './AnalysisResults'

function section(present = true) {
  return {
    present,
    score: present ? 80 : 0,
    feedback: present ? 'Specific section feedback.' : 'This section is not present but would help this resume.',
    strengths: present ? ['Specific strength'] : [],
    weaknesses: present ? ['Specific weakness'] : [],
    suggestions: ['Specific suggestion'],
  }
}

const structuredResume = {
  summary: null,
  education: [{ institution: 'ABC University', degree: 'B.Tech', duration: '2021-2025' }],
  experience: null,
  projects: { projects: [{ name: 'Interview Prep', description: 'AI mentor app', technologies: ['React'] }] },
  skills: { skill_sets: [{ category: 'Backend', skills: ['Python', 'FastAPI'] }] },
  achievements: null,
}

describe('AnalysisResults', () => {
  it('renders resume-only quality analysis with section breakdown and raw data collapsed', () => {
    render(
      <AnalysisResults
        hasResults
        analysis={{
          resume: { structured: structuredResume },
          similarity_score: null,
          analysis_type: 'summary',
          analysis: {
            overall_score: 78,
            overall_review: 'Strong student resume with clear backend focus.',
            experience_level: 'Entry',
            section_breakdown: {
              summary: { present: false, score: 0, feedback: 'A summary would position this backend candidate.', suggestions: ['Mention FastAPI and React.'] },
              education: section(true),
              experience: section(false),
              projects: section(true),
              skills: section(true),
              achievements: section(false),
            },
            key_skills: ['Python', 'FastAPI'],
            notable_strengths: ['Relevant backend projects'],
            potential_gaps: ['No experience section'],
            resume_quality_notes: ['Add metrics only if available'],
          },
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: /resume quality/i })).toBeInTheDocument()
    expect(screen.getByText(/strong student resume/i)).toBeInTheDocument()
    expect(screen.getByText(/section breakdown/i)).toBeInTheDocument()
    expect(screen.getAllByText(/not found/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/python/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/view raw parsed data/i)).toBeInTheDocument()
    expect(screen.queryByText(/extracted resume details/i)).not.toBeInTheDocument()
  })

  it('renders JD fit analysis with overall score, match score, skills, and recommendations', () => {
    render(
      <AnalysisResults
        hasResults
        analysis={{
          resume: { structured: structuredResume },
          similarity_score: 0.5,
          analysis_type: 'fit_analysis',
          analysis: {
            overall_score: 68,
            overall_review: 'Moderate alignment with missing SQL evidence.',
            match_score: 80,
            recommendation: 'Moderate Fit',
            experience_relevance: 'Projects are relevant to backend API work.',
            section_breakdown: {
              summary: { present: false, score: 0, feedback: 'Add a targeted backend summary.', suggestions: ['Mention FastAPI APIs.'] },
              education: section(true),
              experience: section(false),
              projects: section(true),
              skills: section(true),
              achievements: section(false),
            },
            matching_skills: ['Python', 'FastAPI'],
            missing_skills: ['SQL'],
            strengths: ['Backend API project'],
            weaknesses: ['SQL not shown'],
            improvement_suggestions: ['Show SQL evidence if the candidate has it.'],
          },
        }}
      />,
    )

    expect(screen.getByText(/moderate fit/i)).toBeInTheDocument()
    expect(screen.getByText(/match score/i)).toBeInTheDocument()
    expect(screen.getByText(/similarity 50%/i)).toBeInTheDocument()
    expect(screen.getByText(/matching skills/i)).toBeInTheDocument()
    expect(screen.getByText(/missing skills/i)).toBeInTheDocument()
    expect(screen.getByText(/show sql evidence/i)).toBeInTheDocument()
  })

  it('renders controlled backend errors', () => {
    render(
      <AnalysisResults
        hasResults
        analysis={{ analysis: null, errors: ['Resume parsing failed'] }}
      />,
    )

    expect(screen.getByText(/analysis failed/i)).toBeInTheDocument()
    expect(screen.getByText(/resume parsing failed/i)).toBeInTheDocument()
  })
})
