import { createContext, useCallback, useContext, useState } from 'react'
import { googleLogout } from '@react-oauth/google'

interface User {
  credential: string
  name?: string
  email?: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  login: (credential: string, name?: string, email?: string, picture?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(
    (credential: string, name?: string, email?: string, picture?: string) => {
      setUser({ credential, name, email, picture })
    },
    [],
  )

  const logout = useCallback(() => {
    googleLogout()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
