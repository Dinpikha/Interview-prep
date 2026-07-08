export const mentorMessages = [
  {
    id: '1',
    role: 'assistant',
    content:`Hi! I'm your AI Interview Mentor 👋

            I'm here to help you improve your interview performance based on your progress. You can:

            • Paste your dashboard summary for personalized feedback.
            • Ask for resume or interview advice.
            • Discuss your strengths and weaknesses.
            • Get suggestions on what to practice next.
            • Build a focused roadmap to improve your interview skills.

            I won't replace learning the concepts themselves, but I'll help you understand what to improve, why it matters, and how to prepare more effectively.

            What would you like to work on today?`,
    timestamp: getTimestamp(),
  }

]

export const mentorSuggestions = [
  "What should I practice next?",
  "Analyze my progress",
  "How can I improve my interview skills?",
  "Review my resume feedback",
]

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}