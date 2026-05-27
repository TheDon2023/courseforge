/**
 * use-auth.tsx — AuthContext for managing login state across the app.
 * Guest mode: works with localStorage.
 * Logged-in mode: syncs courses/progress to backend.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { fetchCurrentUser, loginUser, registerUser, logoutUser } from '../lib/authApi'
import type { User } from '../lib/authApi'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isGuest: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await loginUser(email, password)
    setUser(u)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await registerUser(name, email, password)
    // Auto-login after register
    const { user: u } = await loginUser(email, password)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
    window.location.reload()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isGuest: !user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
