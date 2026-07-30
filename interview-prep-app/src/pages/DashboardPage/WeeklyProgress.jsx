import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-40 rounded-lg bg-secondary" />
      <div className="grid grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-3 rounded bg-secondary" />
        ))}
      </div>
    </div>
  )
}

export default function WeeklyProgress({ weeklyProgress = [], scoreTrend = [], loading = false }) {
  const maxSessions = Math.max(...weeklyProgress.map((d) => d.sessions), 1)
  const hasTrend = scoreTrend.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasTrend ? 'Score Trend' : 'Weekly Activity'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <ChartSkeleton />
        ) : hasTrend ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Average score by day
            </div>
          <div className="h-64 rounded-lg border border-border bg-background/70 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend} margin={{ top: 12, right: 16, left: -10, bottom: 8 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-primary)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
        ) : weeklyProgress.length > 0 ? (
          <div className="flex h-48 items-end justify-between gap-3 rounded-lg border border-border bg-background/70 p-4">
            {weeklyProgress.map((item) => {
              const height = (item.sessions / maxSessions) * 100

              return (
                <div key={item.date || item.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{item.sessions}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all duration-300 hover:bg-primary"
                      style={{ height: `${Math.max(height, item.sessions > 0 ? 8 : 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{item.day}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">No activity has been saved yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
