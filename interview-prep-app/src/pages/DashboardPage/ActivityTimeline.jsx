import { Activity, Clock, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'

const activityIcons = {
  'Mentor Session': { icon: MessageSquare, tone: 'bg-primary/10 text-primary ring-primary/20' },
  'Mock Interview Completed': { icon: TrendingUp, tone: 'bg-success/10 text-success ring-success/20' },
  'Mock Interview Started': { icon: Clock, tone: 'bg-warning/10 text-warning ring-warning/20' },
  'Resume Updated': { icon: FileText, tone: 'bg-accent/10 text-accent ring-accent/20' },
  'Score Recorded': { icon: TrendingUp, tone: 'bg-success/10 text-success ring-success/20' },
}

export default function ActivityTimeline({ recentActivity = [], loading = false }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-secondary" />
                  <div className="h-4 w-64 max-w-full rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="relative space-y-4">
            {recentActivity.map((item, index) => {
              const config = activityIcons[item.action] ?? {
                icon: Clock,
                tone: 'bg-secondary text-muted ring-border',
              }
              const Icon = config.icon
              const isLast = index === recentActivity.length - 1

              return (
                <motion.div
                  key={item.id}
                  className="relative flex gap-5 rounded-lg p-3 transition-colors hover:bg-secondary/35"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ x: 2 }}
                >
                  {!isLast && (
                    <span className="absolute left-7 top-14 h-[calc(100%+0.5rem)] w-px bg-gradient-to-b from-border to-transparent" />
                  )}
                  <span
                    className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ${config.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
            <Activity className="h-4 w-4" />
            No saved activity yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
