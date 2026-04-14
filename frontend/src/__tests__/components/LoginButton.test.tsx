import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockLogout = vi.fn()
const mockLogin = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (r: { credential: string }) => void }) => (
    <button
      onClick={() => {
        // Build a minimal fake JWT: header.payload.sig
        const payload = btoa(JSON.stringify({ sub: 'u1', name: 'Test User', email: 'test@hdb.sg' }))
        onSuccess({ credential: `header.${payload}.sig` })
      }}
    >
      Sign in with Google
    </button>
  ),
}))

import { useAuth } from '../../contexts/AuthContext'
import { LoginButton } from '../../components/Auth/LoginButton'

describe('LoginButton — logged out', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: null, login: mockLogin, logout: mockLogout })
  })

  it('renders Google sign-in button when no user', () => {
    render(<LoginButton />)
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument()
  })

  it('calls login with decoded payload on Google success', async () => {
    render(<LoginButton />)
    await userEvent.click(screen.getByText(/sign in with google/i))
    expect(mockLogin).toHaveBeenCalledWith(
      expect.stringContaining('.'),  // credential (fake JWT)
      'Test User',
      'test@hdb.sg',
      undefined,  // picture not in fake payload
    )
  })
})

describe('LoginButton — logged in', () => {
  const fakeUser = { credential: 'token', userId: 'user-1', name: 'Cat Fan', email: 'cat@hdb.sg', picture: undefined }

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: fakeUser, login: mockLogin, logout: mockLogout })
  })

  it('renders user name and Logout button', () => {
    render(<LoginButton />)
    expect(screen.getByText('Cat Fan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls logout when Logout button is clicked', async () => {
    render(<LoginButton />)
    await userEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(mockLogout).toHaveBeenCalled()
  })

  it('does not render Google sign-in button when logged in', () => {
    render(<LoginButton />)
    expect(screen.queryByText(/sign in with google/i)).not.toBeInTheDocument()
  })
})
