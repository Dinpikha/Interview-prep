import { Tag } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '../../components/ui'

export default function AnalysisResults({ hasResults, analysis }) {
  if (!hasResults) {
    return (
      <EmptyState
        icon={Tag}
        title="No analysis yet"
        description="Upload your resume and click Analyze to view the extracted text."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Resume</CardTitle>
      </CardHeader>

      <CardContent>
        <pre className="whitespace-pre-wrap text-sm">
          {analysis?.text || "No text extracted."}
        </pre>
      </CardContent>
    </Card>
  )
}