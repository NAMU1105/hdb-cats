import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

vi.mock('@react-oauth/google', () => ({
  googleLogout: vi.fn(),
}))

// A simple button component that exercises the auth context
function AuthTestHarness() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="status">{user ? `logged-in:${user.email}` : 'logged-out'}</span>
      <button onClick={() => login('fake-credential', 'Cat Fan', 'cat@hdb.sg')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function buildFakeToken(payload: object, exp = Math.floor(Date.now() / 1000) + 3600) {
  const header = btoa(JSON.stringify({ alg: 'RS256' }))
  const claims = btoa(JSON.stringify({ ...payload, exp }))
  return `${header}.${claims}.fake-signature`
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('starts logged out', () => {
    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    expect(screen.getByTestId('status')).toHaveTextContent('logged-out')
  })

  it('logs in and displays email', async () => {
    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    expect(screen.getByTestId('status')).toHaveTextContent('logged-in:cat@hdb.sg')
  })

  it('persists session to localStorage on login', async () => {
    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    expect(localStorage.getItem('hdb_cats_auth')).not.toBeNull()
  })

  it('clears localStorage on logout', async () => {
    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    await userEvent.click(screen.getByText('Logout'))
    expect(localStorage.getItem('hdb_cats_auth')).toBeNull()
    expect(screen.getByTestId('status')).toHaveTextContent('logged-out')
  })

  it('restores session from localStorage on mount', () => {
    const token = buildFakeToken({ sub: 'u1', email: 'restored@hdb.sg' })
    localStorage.setItem('hdb_cats_auth', JSON.stringify({ credential: token, email: 'restored@hdb.sg' }))

    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    expect(screen.getByTestId('status')).toHaveTextContent('logged-in:restored@hdb.sg')
  })

  it('does NOT restore an expired token from localStorage', () => {
    const expiredToken = buildFakeToken({ sub: 'u1', email: 'old@hdb.sg' }, Math.floor(Date.now() / 1000) - 1)
    localStorage.setItem('hdb_cats_auth', JSON.stringify({ credential: expiredToken, email: 'old@hdb.sg' }))

    render(<AuthProvider><AuthTestHarness /></AuthProvider>)
    expect(screen.getByTestId('status')).toHaveTextContent('logged-out')
    // Stale entry should have been evicted
    expect(localStorage.getItem('hdb_cats_auth')).toBeNull()
  })
})
