import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, FileSearch, Loader2, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import ResumeUpload from './ResumeUpload'
import JobDescription from './JobDescription'
import AnalysisResults from './AnalysisResults'
import { getUserId } from '../../lib/tokenStorage'

export default function ResumeAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(null)
  const [error, setError] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const [analysis, setAnalysis] = useState(null)
  const isSubmitting = Boolean(loadingPhase)

  const handleAnalyze = async () => {
    if (!selectedFile || isSubmitting) return

    setError(null)
    setAnalysis(null)
    setHasResults(false)
    setLoadingPhase('parsing')
    let phaseTimer = null

    try {
      const formData = new FormData()
      const user_id = getUserId()
      formData.append('pdf', selectedFile)
      formData.append('user_id', user_id)

      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim())
      }

      phaseTimer = window.setTimeout(() => {
        setLoadingPhase('analyzing')
      }, 1400)

      const response = await fetch(`${API_BASE_URL}/resume_analyzer`, {
        method: 'POST',
        body: formData,
      })

      window.clearTimeout(phaseTimer)

      if (!response.ok) {
        let message = 'Resume analysis failed. Please try again.'
        try {
          const errorData = await response.json()
          message = errorData?.detail || errorData?.message || message
        } catch {
          // Keep the default message.
        }
        throw new Error(message)
      }

      setLoadingPhase('analyzing')
      const data = await response.json()
      setAnalysis(data?.response ?? null)
      setHasResults(true)
    } catch (err) {
      console.error('Resume analysis failed:', err)
      setAnalysis(null)
      setError(err?.message || 'Resume analysis failed. Please try again.')
      setHasResults(true)
    } finally {
      if (phaseTimer) window.clearTimeout(phaseTimer)
      setLoadingPhase(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Resume Analyzer"
        description="Upload your resume and the job you're targeting to get instant feedback on structure, keywords, and impact."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeUpload
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onAnalyze={handleAnalyze}
          isAnalyzing={isSubmitting}
        />

        <JobDescription value={jobDescription} onChange={setJobDescription} />
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {loadingPhase ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {loadingPhase === 'parsing' ? (
                    <FileSearch className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {loadingPhase === 'parsing' ? 'Parsing resume...' : 'Analyzing fit...'}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {loadingPhase === 'parsing'
                        ? 'Extracting structured content from your PDF.'
                        : jobDescription.trim()
                          ? 'Comparing your resume against the job description.'
                          : 'Finishing resume parsing without a match score.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[0, 1, 2].map((item) => (
                        <motion.div
                          key={item}
                          className="h-14 rounded-lg bg-secondary/70"
                          animate={{ opacity: [0.45, 0.9, 0.45] }}
                          transition={{ repeat: Infinity, duration: 1.4, delay: item * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <AnalysisResults hasResults={hasResults} analysis={analysis} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
