const steps = [
  {
    step: '01',
    title: 'Choose your focus',
    description: 'Pick a mock interview, upload your resume, or chat with the AI mentor.',
  },
  {
    step: '02',
    title: 'Practice and improve',
    description: 'Get real-time feedback and tailored suggestions after every session.',
  },
  {
    step: '03',
    title: 'Track your progress',
    description: 'Monitor scores, streaks, and milestones on your personal dashboard.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted md:text-base">
            Three simple steps from practice to interview-ready.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center md:text-left">
              <span className="text-4xl font-bold text-primary/30">{item.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
