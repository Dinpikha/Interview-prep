import { Clock, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui'

const activityIcons = {
  'Practice Session': MessageSquare,
  'Resume Updated': FileText,
  'Score Recorded': TrendingUp,
}

export default function RecentActivity({ recentActivity = [], loading = false }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div key={item} className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-secondary" />
                <div className="h-4 w-52 max-w-full rounded bg-secondary" />
              </div>
            </div>
          ))
        ) : recentActivity.length > 0 ? (
          recentActivity.slice(0, 4).map((item, index) => {
            const Icon = activityIcons[item.action] ?? Clock

            return (
              <motion.div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-secondary/20"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                </div>
              </motion.div>
            )
          })
        ) : (
          <p className="text-sm text-muted">No saved activity yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
