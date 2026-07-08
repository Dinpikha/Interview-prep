import { useState } from 'react'
import { PageHeader, Select, Input } from '../../components/ui'
import ResumeUpload from './ResumeUpload'
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
  const [hasResults, setHasResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [role, setRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const isCustomRole = role === 'other'
  const effectiveRole = isCustomRole ? customRole : role
  const handleAnalyze = async () => {
  const formData = new FormData()

  formData.append("pdf", selectedFile)
  // formData.append("role", effectiveRole)
  const response = await fetch(
        "http://127.0.0.1:8000/extract_text",
        {
          method: "POST",
          body:formData,
        }
      )
    const data = await response.json()
    
    setAnalysis(data)
    setHasResults(true)
  
}

  return (
    <div>
      <PageHeader
        title="Resume Analyzer"
        description="Upload or paste your resume to get instant feedback on structure, keywords, and impact."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
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
        
        <AnalysisResults
  hasResults={hasResults}
  analysis={analysis}
/>
      </div>
    </div>
    
  )
}