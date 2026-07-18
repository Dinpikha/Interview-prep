const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
const REDIRECT_URI =
  import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`

export function buildGithubAuthUrl() {
  if (!GITHUB_CLIENT_ID) {
    console.error(
      
    )
  }

  const state = crypto.randomUUID()
  sessionStorage.setItem('github_oauth_state', state)

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID ?? '',
    redirect_uri: REDIRECT_URI,
    scope: 'read:user user:email',
    state,
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export function consumeGithubOAuthState() {
  const stored = sessionStorage.getItem('github_oauth_state')
  sessionStorage.removeItem('github_oauth_state')
  return stored
}
