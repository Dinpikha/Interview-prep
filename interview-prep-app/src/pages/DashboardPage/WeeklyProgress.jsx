import { weeklyProgress } from './dashboardData'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'

const maxSessions = Math.max(...weeklyProgress.map((d) => d.sessions), 1)

export default function WeeklyProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
          {weeklyProgress.map((item) => {
            const height = (item.sessions / maxSessions) * 100

            return (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-foreground">{item.sessions}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                </div>
                <span className="text-xs text-muted">{item.day}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
