import { FileText, Upload, X } from 'lucide-react'
import { Button } from '../../components/ui'

export default function ResumeUpload({
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
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Resume</h2>
        <p className="mt-1 text-sm text-muted">Upload the PDF you want to evaluate.</p>
      </div>
        <div className="space-y-3">
          <label
            htmlFor="resume-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-card/70 px-6 py-10 text-center transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white"
          >
            <Upload className="mb-2 h-8 w-8 text-accent" />
            <p className="text-sm font-medium text-foreground">
              Drop your resume here or click to browse
            </p>
            <p className="text-xs text-muted">PDF up to 5MB</p>
            <input
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
          </label>

          {selectedFile && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
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
                disabled={isAnalyzing}
                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-border/50 hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={onAnalyze}
          disabled={isAnalyzing || !selectedFile}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
    </section>
  )
}
