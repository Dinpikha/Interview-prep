import { useState } from 'react'
import { PageHeader, Select, Input } from '../../components/ui'
import ResumeUpload from './ResumeUpload'
import JobDescription from './JobDescription'
import AnalysisResults from './AnalysisResults'
import { getUserId } from '../../lib/tokenStorage'

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
      const user_id = getUserId();
      formData.append('pdf', selectedFile)
      formData.append("user_id", user_id)
      formData.append('role', effectiveRole)
      formData.append('job_description', jobDescription)
      console.log('hey we are here')
      for (const [key, value] of formData.entries()) {
    console.log(key, value);
}

      const response = await fetch('http://127.0.0.1:8000/resume_analyzer', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      console.log(data);
      // Backend shape: { success, response: { success, analysis: {...} } }
      setAnalysis(data?.response ?? null)
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