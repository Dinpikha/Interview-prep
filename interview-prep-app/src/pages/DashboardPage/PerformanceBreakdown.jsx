import { performanceAreas } from './dashboardData'
import { Card, CardContent, CardHeader, CardTitle, ProgressBar } from '../../components/ui'

export default function PerformanceBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {performanceAreas.map((area) => (
          <ProgressBar
            key={area.label}
            label={area.label}
            value={area.score}
          />
        ))}
      </CardContent>
    </Card>
  )
}
