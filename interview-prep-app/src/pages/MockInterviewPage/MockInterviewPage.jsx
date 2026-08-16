import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import InterviewList from './InterviewList'
import InterviewSession from './InterviewSession'

export default function MockInterviewPage() {
  const [activeFilter, setActiveFilter] = useState({ category: null, difficulty: null })
  const [activeInterview, setActiveInterview] = useState(null)

  if (activeInterview) {
    return (
      <InterviewSession
        interview={activeInterview}
        onExit={() => setActiveInterview(null)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mock Interviews"
        description="Choose a focus area and practice with realistic, timed question sessions."
        className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm"
      />

      <InterviewList
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onStart={setActiveInterview}
      />
    </div>
  )
}
