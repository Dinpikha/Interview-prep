import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import InterviewList from './InterviewList'
import InterviewSession from './InterviewSession'

export default function MockInterviewPage() {
  const [activeFilter, setActiveFilter] = useState('All')
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
    <div>
      <PageHeader
        title="Mock Interviews"
        description="Choose an interview type and practice with realistic, timed question sessions."
      />

      <InterviewList
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onStart={setActiveInterview}
      />
    </div>
  )
}
