import { mockInterviews } from '../../data/mockInterviews'
import InterviewCard from './InterviewCard'

const filters = ['All', 'Available', 'Completed']

export default function InterviewList({ activeFilter, onFilterChange, onStart }) {
  const filtered = mockInterviews.filter((interview) => {
    if (activeFilter === 'Available') return interview.status === 'available'
    if (activeFilter === 'Completed') return interview.status === 'completed'
    return true
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted hover:text-foreground'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((interview) => (
          <InterviewCard key={interview.id} interview={interview} onStart={onStart} />
        ))}
      </div>
    </div>
  )
}
