import { cn } from '../../lib/cn'
import { Card, CardContent } from './Card'

export default function StatCard({ label, value, change, icon: Icon, className }) {
  return (
    <Card className={cn('transition-colors hover:border-primary/30', className)}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{label}</p>
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {change && <p className="text-xs text-muted-foreground">{change}</p>}
      </CardContent>
    </Card>
  )
}
