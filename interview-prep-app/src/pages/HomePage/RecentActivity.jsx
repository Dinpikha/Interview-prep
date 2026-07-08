import { Clock } from 'lucide-react'
import { recentActivity } from '../../data/dashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {recentActivity.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.action}</p>
              <p className="text-sm text-muted">{item.detail}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.time}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
