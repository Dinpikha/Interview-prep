import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { mockInterviews } from '../../data/mockInterviews'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import InterviewCard from './InterviewCard'

const difficulties = ['Beginner', 'Intermediate', 'Advanced']

export default function InterviewList({ activeFilter, onFilterChange, onStart }) {
  const selectedCategory = activeFilter?.category || null
  const selectedDifficulty = activeFilter?.difficulty || null
  const selectedInterview = mockInterviews.find((interview) => interview.id === selectedCategory)

  const chooseCategory = (interview) => {
    onFilterChange({ category: interview.id, difficulty: null })
  }

  const chooseDifficulty = (difficulty) => {
    onFilterChange({ category: selectedCategory, difficulty })
  }

  if (!selectedInterview) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">Choose an interview category</p>
          <p className="text-sm text-muted">Questions are generated fresh for the category you pick.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockInterviews.map((interview, index) => {
            const Icon = interview.icon
            return (
              <motion.button
                key={interview.id}
                type="button"
                onClick={() => chooseCategory(interview)}
                className="h-full text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="subtle-lift h-full overflow-hidden transition-colors hover:border-primary/35">
                  <CardHeader className="gap-6 p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      {Icon && <Icon className="h-5 w-5" />}
                    </span>
                    <div>
                      <CardTitle>{interview.title}</CardTitle>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{interview.description}</p>
                    </div>
                  </CardHeader>
                </Card>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFilterChange({ category: null, difficulty: null })}
      >
        <ArrowLeft className="h-4 w-4" />
        Change category
      </Button>

      <Card className="workspace-card">
        <CardContent className="space-y-5 pt-6">
          <div>
            <p className="text-sm font-medium text-foreground">Choose difficulty for {selectedInterview.title}</p>
            <p className="mt-1 text-sm text-muted">The generated questions will match this level.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {difficulties.map((difficulty) => {
              const isSelected = selectedDifficulty === difficulty
              return (
                <motion.button
                  key={difficulty}
                  type="button"
                  onClick={() => chooseDifficulty(difficulty)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15'
                      : 'border-border bg-card text-muted hover:border-primary/30 hover:bg-secondary hover:text-foreground'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {difficulty}
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDifficulty && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InterviewCard
            interview={{ ...selectedInterview, difficulty: selectedDifficulty }}
            onStart={onStart}
          />
        </div>
      )}
    </div>
  )
}
