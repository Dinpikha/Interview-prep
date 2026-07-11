import { FileText, Upload, X } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '../../components/ui'

export default function ResumeUpload({
  resumeText,
  onTextChange,
  selectedFile,
  onFileSelect,
  onAnalyze,
  isAnalyzing,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        <div className="space-y-3">
          <label
            htmlFor="resume-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-secondary/30"
          >
            <Upload className="mb-2 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">
              Drop your resume here or click to browse
            </p>
            <p className="text-xs text-muted">PDF, DOCX up to 5MB</p>
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-border/50 hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            or paste resume text
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Textarea
          aria-label="Resume content"
          placeholder="Paste your resume text here for analysis..."
          value={resumeText}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-48 leading-relaxed"
        />

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