import { Clock, FileText, MessageSquare, Mic } from 'lucide-react'
import { recentActivity } from '../../data/dashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'

const activityIcons = {
  'Completed Mock Interview': Mic,
  'Resume Analyzed': FileText,
  'AI Mentor Session': MessageSquare,
}

export default function ActivityTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {recentActivity.map((item, index) => {
            const Icon = activityIcons[item.action] ?? Clock
            const isLast = index === recentActivity.length - 1

            return (
              <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && (
                  <span className="absolute left-4 top-10 h-full w-px bg-border" />
                )}
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-sm text-muted">{item.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
