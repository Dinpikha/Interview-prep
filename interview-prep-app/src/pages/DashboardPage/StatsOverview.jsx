import { Flame, Target, TrendingUp, Trophy } from 'lucide-react'
import { dashboardStats } from '../../data/dashboardStats'
import { StatCard } from '../../components/ui'

const statIcons = {
  interviews: Trophy,
  score: TrendingUp,
  streak: Flame,
  resumes: Target,
}

export default function StatsOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          icon={statIcons[stat.id]}
        />
      ))}
    </div>
  )
}
