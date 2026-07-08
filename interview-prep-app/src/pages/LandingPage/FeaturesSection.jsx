import { Bot, FileText, LayoutDashboard, Mic } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui'

const features = [
  {
    icon: Mic,
    title: 'Mock Interviews',
    description:
      'Simulate real interview scenarios with timed sessions and role-specific question sets.',
  },
  {
    icon: FileText,
    title: 'Resume Analyzer',
    description:
      'Upload your resume and get actionable feedback on keywords, structure, and impact.',
  },
  {
    icon: Bot,
    title: 'AI Mentor',
    description:
      'Chat with an AI coach for personalized guidance on technical and behavioral rounds.',
  },
  {
    icon: LayoutDashboard,
    title: 'Progress Dashboard',
    description:
      'Track your practice streak, scores, and improvement over time in one view.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Everything you need to prepare
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted md:text-base">
            A complete toolkit designed to help you practice smarter and interview better.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="transition-colors hover:border-primary/30"
            >
              <CardHeader>
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
