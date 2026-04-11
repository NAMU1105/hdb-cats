import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      getPayload: () => ({ sub: 'user-1', email: 'user@test.com' }),
    }),
  })),
}))

vi.mock('../../lib/s3', () => ({
  BUCKET: 'test-bucket',
  buildCdnUrl: (key: string) => `https://test.cloudfront.net/${key}`,
  createPresignedPutUrl: vi.fn().mockResolvedValue('https://s3.presigned.url'),
}))

import { handler } from '../../handlers/getUploadUrl'

const AUTH_HEADER = 'Bearer valid-token'

function makeEvent(body: object, headers: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return {
    headers: { authorization: AUTH_HEADER, ...headers },
    body: JSON.stringify(body),
    requestContext: { http: { method: 'POST' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('getUploadUrl handler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without a valid auth token', async () => {
    const event = makeEvent(
      { filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 1000 },
      { authorization: '' },
    )
    const res = await handler(event, {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 for unsupported content type', async () => {
    const res = await handler(
      makeEvent({ filename: 'cat.gif', contentType: 'image/gif', fileSizeBytes: 1000 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when file exceeds 10 MB', async () => {
    const res = await handler(
      makeEvent({ filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 10_000_001 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await handler(makeEvent({}), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns presigned URLs and catId on valid request', async () => {
    const res = await handler(
      makeEvent({ filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 500_000 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body).toHaveProperty('catId')
    expect(body).toHaveProperty('uploadUrl')
    expect(body).toHaveProperty('thumbUploadUrl')
    expect(body.imageKey).toMatch(/^uploads\/.+\/original\.jpg$/)
  })
})
