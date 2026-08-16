import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, FileSearch, Loader2, Plus, Sparkles } from 'lucide-react'
import { Button, PageHeader } from '../../components/ui'
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
  const [showJobDescription, setShowJobDescription] = useState(false)
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
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Resume Analyzer"
        description="Evaluate resume quality, role alignment, strengths, gaps, and concrete improvements."
        className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm"
      />

      <section className="workspace-card rounded-3xl border border-border bg-secondary/35 p-5 sm:p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold text-accent">Analysis setup</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Prepare your resume intelligence report</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            Start with a resume-only review, or add a target role to compare skills, gaps, and fit.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:divide-x lg:divide-border">
          <ResumeUpload
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onAnalyze={handleAnalyze}
            isAnalyzing={isSubmitting}
          />

          <div className="lg:pl-6">
            <AnimatePresence mode="wait">
              {showJobDescription ? (
                <motion.div
                  key="job-description"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <JobDescription
                    value={jobDescription}
                    onChange={setJobDescription}
                    onRemove={() => {
                      setJobDescription('')
                      setShowJobDescription(false)
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="add-job-description"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex h-full items-start"
                >
                  <Button
                    variant="outline"
                    className="group h-auto w-full justify-start rounded-2xl border-dashed bg-card/70 px-5 py-5 text-left"
                    onClick={() => setShowJobDescription(true)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-105">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">Add Target Role</span>
                      <span className="block text-xs font-normal text-muted">
                        Optional, but recommended for match scoring.
                      </span>
                    </span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {loadingPhase ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="workspace-card rounded-2xl border border-border bg-card p-6"
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
