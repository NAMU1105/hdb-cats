import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
if (!CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID environment variable is not set')

const client = new OAuth2Client(CLIENT_ID)

export interface GoogleUser {
  userId: string
  email: string
}

export async function verifyGoogleToken(authHeader: string | undefined): Promise<GoogleUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)

  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload?.sub) return null
    return { userId: payload.sub, email: payload.email ?? '' }
  } catch {
    return null
  }
}
