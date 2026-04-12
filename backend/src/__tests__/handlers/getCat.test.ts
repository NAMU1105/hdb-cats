import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      getPayload: () => ({ sub: 'user-1', email: 'user@test.com' }),
    }),
  })),
}))

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('../../lib/dynamo', () => ({
  ddb: { send: mockSend },
  TABLE_NAME: 'test-table',
  PK: 'CAT',
}))

vi.mock('../../lib/s3', () => ({
  buildCdnUrl: (key: string) => `https://cdn.test/${key}`,
}))

import { handler } from '../../handlers/getCat'

const MOCK_CAT = {
  id: 'cat-1',
  title: 'Orange Tom',
  latitude: 1.3521,
  longitude: 103.8198,
  imageKey: 'uploads/cat-1/original.jpg',
  thumbKey: 'uploads/cat-1/thumb.jpg',
  cdnUrl: 'https://cdn.test/uploads/cat-1/original.jpg',
  thumbUrl: 'https://cdn.test/uploads/cat-1/thumb.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active',
  userId: 'user-1',
  likeCount: 5,
}

function makeEvent(id: string | undefined, authHeader?: string): APIGatewayProxyEventV2 {
  return {
    pathParameters: id ? { id } : {},
    headers: authHeader ? { authorization: authHeader } : {},
    requestContext: { http: { method: 'GET' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('getCat handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent(undefined), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 404 when cat does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(makeEvent('no-such-cat'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 404 when cat is soft-deleted', async () => {
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, status: 'deleted' } })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 200 with cat data when no auth header', async () => {
    mockSend.mockResolvedValueOnce({ Item: MOCK_CAT })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.id).toBe('cat-1')
    expect(body.title).toBe('Orange Tom')
    expect(body.likedByMe).toBeUndefined()
  })

  it('returns likedByMe: false when auth provided but user has not liked', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })   // get cat
      .mockResolvedValueOnce({ Item: undefined })    // get like — not found
    const res = await handler(makeEvent('cat-1', 'Bearer valid-token'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    expect(JSON.parse((res as any).body).likedByMe).toBe(false)
  })

  it('returns likedByMe: true when auth provided and user has liked', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })
      .mockResolvedValueOnce({ Item: { PK: 'CAT', SK: 'LIKE#cat-1#user-1' } })  // like found
    const res = await handler(makeEvent('cat-1', 'Bearer valid-token'), {} as any, () => {})
    expect(JSON.parse((res as any).body).likedByMe).toBe(true)
  })

  it('returns photos array in response', async () => {
    mockSend.mockResolvedValueOnce({ Item: MOCK_CAT })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    const body = JSON.parse((res as any).body)
    expect(Array.isArray(body.photos)).toBe(true)
    expect(body.photos).toHaveLength(1)
  })
})
