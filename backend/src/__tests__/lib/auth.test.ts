import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the entire library before the module under test imports it
vi.mock('google-auth-library', () => {
  const verifyIdToken = vi.fn()
  return {
    OAuth2Client: vi.fn(() => ({ verifyIdToken })),
  }
})

import { OAuth2Client } from 'google-auth-library'
import { verifyGoogleToken } from '../../lib/auth'

function getMockVerify() {
  // OAuth2Client is a mock constructor — grab the verifyIdToken off the first instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (OAuth2Client as unknown as any).mock.results[0].value
    .verifyIdToken as ReturnType<typeof vi.fn>
}

describe('verifyGoogleToken()', () => {
  beforeEach(() => {
    getMockVerify().mockReset()
  })

  it('returns null when Authorization header is missing', async () => {
    expect(await verifyGoogleToken(undefined)).toBeNull()
  })

  it('returns null when header does not start with "Bearer "', async () => {
    expect(await verifyGoogleToken('Basic abc')).toBeNull()
  })

  it('returns null when verifyIdToken throws (invalid/expired token)', async () => {
    getMockVerify().mockRejectedValueOnce(new Error('Token expired'))
    expect(await verifyGoogleToken('Bearer bad-token')).toBeNull()
  })

  it('returns userId and email on a valid token', async () => {
    getMockVerify().mockResolvedValueOnce({
      getPayload: () => ({ sub: 'user-123', email: 'cat@hdb.sg' }),
    })
    const result = await verifyGoogleToken('Bearer valid-token')
    expect(result).toEqual({ userId: 'user-123', email: 'cat@hdb.sg' })
  })

  it('returns null when payload is missing sub', async () => {
    getMockVerify().mockResolvedValueOnce({
      getPayload: () => ({ email: 'cat@hdb.sg' }), // no sub
    })
    expect(await verifyGoogleToken('Bearer partial-token')).toBeNull()
  })
})
