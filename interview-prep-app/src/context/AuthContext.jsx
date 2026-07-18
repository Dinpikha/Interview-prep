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

  const setPassword = useCallback(
    async (newPassword) => {
      const result = await authApi.setPassword(newPassword)
      setUser((prev) => {
        if (!prev) return prev 
        const updated = { ...prev, has_password: true }
        setSession({ user:update })
        return updated
      })
      return result
    },[],
  )

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken()

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
    setPassword,
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
