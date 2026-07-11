import { Briefcase, Sparkles } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle, Textarea } from '../../components/ui'

export default function JobDescription({ value, onChange }) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const isThin = wordCount > 0 && wordCount < 30

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            <CardTitle>Job Description</CardTitle>
          </div>

          {wordCount > 0 && (
            <Badge variant={isThin ? 'warning' : 'primary'}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <p className="text-sm text-muted">
          Paste the job posting here. Your resume will be evaluated against its requirements and
          keywords, so the more detail, the better the match.
        </p>

        <Textarea
          aria-label="Job description"
          placeholder={
            'Paste the job description here — role summary, responsibilities, required skills, and preferred qualifications...'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-56 resize-y leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3 pt-0.5">
          {isThin ? (
            <p className="text-xs text-warning">
              A bit thin — add more detail for a more accurate match.
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Keywords here are matched against your resume automatically.
            </p>
          )}

          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}