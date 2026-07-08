import { FileText, Upload } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '../../components/ui'

export default function ResumeUpload({ resumeText, onTextChange, selectedFile, onFileSelect, onAnalyze, isAnalyzing }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <label
          htmlFor="resume-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-primary/50 hover:bg-secondary/30"
        >
          <Upload className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">
            Drop your resume here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted">PDF, DOCX up to 5MB</p>
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>

        {selectedFile && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-x-0 top-3 flex items-center justify-center">
            <span className="bg-card px-3 text-xs text-muted">or paste resume text</span>
          </div>
          <div className="border-t border-border pt-6">
            <Textarea
              label="Resume content"
              placeholder="Paste your resume text here for analysis..."
              value={resumeText}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-48"
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={onAnalyze}
          disabled={isAnalyzing || (!resumeText.trim() && !selectedFile)}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
      </CardContent>
    </Card>
  )
}
