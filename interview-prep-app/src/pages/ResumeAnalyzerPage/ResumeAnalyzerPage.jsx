import { useState } from 'react'
import { PageHeader, Select, Input } from '../../components/ui'
import ResumeUpload from './ResumeUpload'
import JobDescription from './JobDescription'
import AnalysisResults from './AnalysisResults'

const ROLE_OPTIONS = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Designer (UI/UX)',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'Project Manager',
  'Customer Success',
  'HR / Recruiter',
  { value: 'other', label: 'Other (type your own)' },
]

export default function ResumeAnalyzerPage() {
  const [resumeText, setResumeText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const isCustomRole = role === 'other'
  const effectiveRole = isCustomRole ? customRole : role

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const formData = new FormData()

      formData.append('pdf', selectedFile)
      // NOTE: role and job_description aren't read by /extract_text yet —
      // the endpoint only declares `pdf: UploadFile`, so FastAPI silently
      // ignores these extra fields. Sending them now so the backend can
      // start reading them as soon as that param is added.
      formData.append('role', effectiveRole)
      formData.append('job_description', jobDescription)

      const response = await fetch('http://127.0.0.1:8000/extract_text', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      // Backend shape: { success, response: { success, analysis: {...} } }
      setAnalysis(data?.response?.analysis ?? null)
      setHasResults(true)
    } catch (err) {
      console.error('Resume analysis failed:', err)
      setAnalysis(null)
      setHasResults(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Resume Analyzer"
        description="Upload your resume and the job you're targeting to get instant feedback on structure, keywords, and impact."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Select
          label="Target role"
          placeholder="Select a role to evaluate against"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        {isCustomRole && (
          <Input
            label="Custom role"
            placeholder="Enter the role title"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            autoFocus
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeUpload
          resumeText={resumeText}
          onTextChange={setResumeText}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          role={effectiveRole}
        />

        <JobDescription value={jobDescription} onChange={setJobDescription} />
      </div>

      <div className="mt-6">
        <AnalysisResults hasResults={hasResults} analysis={analysis} />
      </div>
    </div>
  )
}