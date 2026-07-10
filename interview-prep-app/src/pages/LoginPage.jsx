import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../constants/routes'

export default function LoginPage() {
  const [mode, setMode] = useState('login') 
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setError('')
    try {
      const response = await fetch('http://127.0.0.1:8000/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          mode,
        }),
      })
      console.log(response.status)
     if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail)
    }
      const data = await response.json()
      
      if (!data.success) {
        setError(data.response)
        return
      }
      localStorage.setItem("user_id", data.user_id)
      localStorage.setItem("username", username.trim())

     
      login(username.trim())
      navigate(ROUTES.WELCOME)
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 page-transition">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome to Interview Prep
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in to continue your prep journey
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex rounded-md border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
              }}
              className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                autoComplete="username"
              />
            </div>

            {error && <p className="mb-4 text-sm text-danger">{error}</p>}

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
        </div>

      
      </div>
    </div>
  )
}