import { Globe } from 'lucide-react'
import { Button } from '../../components/ui'

export default function WebSearchToggle({ enabled, onToggle, disabled }) {
  return (
    <Button
      type="button"
      variant={enabled ? 'primary' : 'outline'}
      size="lg"
      disabled={disabled}
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      title="Toggle web search"
    >
      <Globe className="h-4 w-4" />
      <span className="sr-only">Toggle web search</span>
    </Button>
  )
}