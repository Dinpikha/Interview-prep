import { mentorSuggestions } from '../../data/mentorMessages'

export default function SuggestionChips({ onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {mentorSuggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
