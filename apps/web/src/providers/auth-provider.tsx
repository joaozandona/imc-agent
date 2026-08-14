'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User } from '@/types/user'

type AuthContextValue = {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: React.ReactNode
  initialUser: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(initialUser)

  useEffect(() => {
    setUserState(initialUser)
  }, [initialUser])

  const setUser = useCallback((next: User | null) => {
    setUserState(next)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: Boolean(user),
    }),
    [user, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
