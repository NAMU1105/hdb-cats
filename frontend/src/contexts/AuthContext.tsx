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

const STORAGE_KEY = 'hdb_cats_auth'

function loadFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as User
    // Check token expiry
    const payload = JSON.parse(atob(user.credential.split('.')[1])) as { exp: number }
    if (Date.now() / 1000 > payload.exp) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return user
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadFromStorage)

  const login = useCallback(
    (credential: string, name?: string, email?: string, picture?: string) => {
      const u = { credential, name, email, picture }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      setUser(u)
    },
    [],
  )

  const logout = useCallback(() => {
    googleLogout()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
