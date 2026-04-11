import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'

export function LoginButton() {
  const { user, login, logout } = useAuth()

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.picture && (
          <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full" />
        )}
        <span className="text-red-200 text-xs hidden sm:inline">{user.name ?? user.email}</span>
        <button
          onClick={logout}
          className="text-red-200 text-xs hover:text-white underline"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <GoogleLogin
      onSuccess={(res) => {
        if (!res.credential) return
        // Decode public claims from ID token (no secret data, safe to read client-side)
        const payload = JSON.parse(atob(res.credential.split('.')[1])) as {
          sub: string
          name?: string
          email?: string
          picture?: string
        }
        login(res.credential, payload.name, payload.email, payload.picture)
      }}
      onError={() => console.error('Google login failed')}
      shape="pill"
      size="medium"
      text="signin_with"
      theme="filled_white"
    />
  )
}
