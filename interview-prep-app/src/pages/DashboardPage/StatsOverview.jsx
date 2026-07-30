import { BarChart3, Target, TrendingUp, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { StatCard } from '../../components/ui'

const statIcons = {
  interviews: Trophy,
  sessions: BarChart3,
  score: TrendingUp,
  resumes: Target,
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-secondary" />
        <div className="h-8 w-8 rounded-lg bg-secondary" />
      </div>
      <div className="h-8 w-20 rounded bg-secondary" />
      <div className="mt-3 h-3 w-24 rounded bg-secondary" />
    </div>
  )
}

export default function StatsOverview({ stats = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <StatSkeleton key={item} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
        >
          <StatCard
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={statIcons[stat.id]}
          />
        </motion.div>
      ))}
    </div>
  )
}
