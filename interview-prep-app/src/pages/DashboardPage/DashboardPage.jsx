import { Button, PageHeader, SummarySection } from '../../components/ui'
import StatsOverview from './StatsOverview'
import WeeklyProgress from './WeeklyProgress'
import PerformanceBreakdown from './PerformanceBreakdown'
import ActivityTimeline from './ActivityTimeline'
import { useState,useEffect } from 'react'
export default function DashboardPage() {
   const [summary,setSummary]=useState("");
  
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
        title="Report Summary"
        
        points={summaryPoints}
      />

      <PageHeader
        title="Dashboard"
        description="Track your interview prep progress, scores, and activity over time."
      >
        <Button variant="outline" size="sm">
          Last 7 days
        </Button>
      </PageHeader>

      <div className="mb-8">
        <StatsOverview />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <WeeklyProgress />
        <PerformanceBreakdown />
      </div>

      <ActivityTimeline />
    </div>
  )
}
