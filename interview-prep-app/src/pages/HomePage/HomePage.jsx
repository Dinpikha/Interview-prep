import { useNavigate } from 'react-router-dom'
import { Flame, Target, TrendingUp, Trophy } from 'lucide-react'
import { dashboardStats } from '../../data/dashboardStats'
import { ROUTES } from '../../constants/routes'
import { Button, PageHeader, StatCard, SummarySection } from '../../components/ui'
import QuickActions from './QuickActions'
import RecentActivity from './RecentActivity'
import RecommendedInterviews from './RecommendedInterviews'
import { useEffect, useState } from "react";

const statIcons = {
  interviews: Trophy,
  score: TrendingUp,
  streak: Flame,
  resumes: Target,
}


export default function HomePage() {
  const [summary,setSummary]=useState("");
  const navigate = useNavigate()
  const userId = localStorage.getItem("user_id");


  useEffect(() => {
      async function fetchSummary() {
          const userId = localStorage.getItem("user_id");

          const response = await fetch("http://localhost:8000/return_summary", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  user_id: userId
              })
          });

          const data = await response.json();
          setSummary(data.summary);
      }

      fetchSummary();
  }, []);
    const summaryPoints = summary
    ? summary
        .split("\n")
        .filter(line => line.trim() !== "" && line.startsWith("-"))
        .map(line => line.replace("-", "").trim())
    : [];
  return (
    
    <div>
    <SummarySection
        title="What MentorAI Knows About You"
        description="A personalized profile built from your conversations, resume, and progress to help MentorAI give more relevant guidance.."
        points={summaryPoints}
      />
      <PageHeader
        title="Welcome back!"
        description="Continue your interview prep journey. Pick up where you left off or explore something new."
      >
        <Button onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
          Start Mock Interview
        </Button>
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecommendedInterviews />
        <RecentActivity />
      </div>
    </div>
  )
}
