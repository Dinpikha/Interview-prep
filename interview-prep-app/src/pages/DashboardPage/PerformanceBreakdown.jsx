import { Card, CardContent, CardHeader, CardTitle, ProgressBar } from '../../components/ui'
import { motion } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function PerformanceBreakdown({ performanceAreas = [], loading = false }) {
  const radarData = performanceAreas.map((area) => ({
    area: area.label,
    score: area.score,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {loading ? (
          [0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-32 rounded bg-secondary" />
              <div className="h-2 rounded-full bg-secondary" />
            </div>
          ))
        ) : performanceAreas.length > 0 ? (
          <>
            {performanceAreas.length >= 3 && (
              <motion.div
                className="h-56 rounded-lg border border-border bg-background/70 p-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                      }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            <div className="space-y-4">
              {performanceAreas.map((area, index) => (
                <motion.div
                  key={area.label}
                  className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-secondary/20"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProgressBar label={area.label} value={area.score} />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">No scored metrics have been recorded yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
