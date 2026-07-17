import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../lib/api'
import {
  getStoredUser,
  getRefreshToken,
  setSession,
  clearSession,
} from '../lib/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [authLoading, setAuthLoading] = useState(false)

  const applySession = useCallback((data) => {
    setSession(data)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(
    async (identifier, password) => {
      setAuthLoading(true)
      try {
        const data = await authApi.login(identifier, password)
        return applySession(data)
      } finally {
        setAuthLoading(false)
      }
    },
    [applySession],
  )

  const signup = useCallback(
    async (username, email, password) => {
      setAuthLoading(true)
      try {
        const data = await authApi.signup(username, email, password)
        return applySession(data)
      } finally {
        setAuthLoading(false)
      }
    },
    [applySession],
  )

  const loginWithGithub = useCallback(
    async (code) => {
      setAuthLoading(true)
      try {
        const data = await authApi.githubLogin(code)
        return applySession(data)
      } finally {
        setAuthLoading(false)
      }
    },
    [applySession],
  )

  const changePassword = useCallback((currentPassword, newPassword) => {
    return authApi.changePassword(currentPassword, newPassword)
  }, [])

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken()
    // fire-and-forget: revoke server-side, but don't block the UI on it
    if (refreshToken) authApi.logout(refreshToken).catch(() => {})
    clearSession()
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    authLoading,
    login,
    signup,
    loginWithGithub,
    changePassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
