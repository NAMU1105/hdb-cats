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

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('../../lib/dynamo', () => ({
  ddb: { send: mockSend },
  TABLE_NAME: 'test-table',
  PK: 'CAT',
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

const VALID_BODY = { filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 500_000, thumbSizeBytes: 80_000 }

describe('getUploadUrl handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no catId lookup needed (new cat flow)
    mockSend.mockResolvedValue({ Item: undefined })
  })

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
      makeEvent({ filename: 'cat.gif', contentType: 'image/gif', fileSizeBytes: 1000, thumbSizeBytes: 200 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when file exceeds 10 MB', async () => {
    const res = await handler(
      makeEvent({ filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 10_000_001, thumbSizeBytes: 200 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when thumbSizeBytes is missing', async () => {
    const res = await handler(
      makeEvent({ filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 500_000 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await handler(makeEvent({}), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns presigned URLs and catId on valid request', async () => {
    const res = await handler(makeEvent(VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body).toHaveProperty('catId')
    expect(body).toHaveProperty('uploadUrl')
    expect(body).toHaveProperty('thumbUploadUrl')
    expect(body.imageKey).toMatch(/^uploads\/.+\/original\.jpg$/)
  })

  it('returns 404 when catId refers to a non-existent cat', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(
      makeEvent({ ...VALID_BODY, catId: 'ghost-cat' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 404 when catId refers to a deleted cat', async () => {
    mockSend.mockResolvedValueOnce({ Item: { id: 'cat-1', status: 'deleted' } })
    const res = await handler(
      makeEvent({ ...VALID_BODY, catId: 'cat-1' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(404)
  })

  it('returns presigned URLs for adding photo to existing active cat', async () => {
    mockSend.mockResolvedValueOnce({ Item: { id: 'cat-1', status: 'active' } })
    const res = await handler(
      makeEvent({ ...VALID_BODY, catId: 'cat-1' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.catId).toBe('cat-1')
    // Additional photos use a photoId-based path, not original.ext
    expect(body.imageKey).not.toMatch(/original/)
  })
})
