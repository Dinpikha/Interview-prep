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
          className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
