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

import { handler } from '../../handlers/deletePhoto'

const PHOTO_1 = {
  s3Key: 'uploads/cat-1/photo-1.jpg',
  thumbKey: 'uploads/cat-1/thumb-1.jpg',
  cdnUrl: 'https://cdn.test/uploads/cat-1/photo-1.jpg',
  thumbUrl: 'https://cdn.test/uploads/cat-1/thumb-1.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  userId: 'user-1',
}

const PHOTO_2 = {
  s3Key: 'uploads/cat-1/photo-2.jpg',
  thumbKey: 'uploads/cat-1/thumb-2.jpg',
  cdnUrl: 'https://cdn.test/uploads/cat-1/photo-2.jpg',
  thumbUrl: 'https://cdn.test/uploads/cat-1/thumb-2.jpg',
  uploadedAt: '2026-04-12T01:00:00Z',
  userId: 'user-2',  // different uploader
}

const MOCK_CAT = {
  id: 'cat-1',
  title: 'Orange Tom',
  latitude: 1.3521,
  longitude: 103.8198,
  imageKey: PHOTO_1.s3Key,
  thumbKey: PHOTO_1.thumbKey,
  cdnUrl: PHOTO_1.cdnUrl,
  thumbUrl: PHOTO_1.thumbUrl,
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active',
  userId: 'user-1',
  photos: [PHOTO_1, PHOTO_2],
}

function makeEvent(
  id: string | undefined,
  photoIndex: string | undefined,
  authHeader = 'Bearer valid-token',
): APIGatewayProxyEventV2 {
  return {
    pathParameters: { ...(id ? { id } : {}), ...(photoIndex !== undefined ? { photoIndex } : {}) },
    headers: { authorization: authHeader },
    requestContext: { http: { method: 'DELETE' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('deletePhoto handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent('cat-1', '0', ''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent(undefined, '0'), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when photoIndex is missing', async () => {
    const res = await handler(makeEvent('cat-1', undefined), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when photoIndex is not a number', async () => {
    const res = await handler(makeEvent('cat-1', 'abc'), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when photoIndex is negative', async () => {
    const res = await handler(makeEvent('cat-1', '-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 404 when cat does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(makeEvent('cat-1', '0'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 404 when cat is deleted', async () => {
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, status: 'deleted' } })
    const res = await handler(makeEvent('cat-1', '0'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 400 when photoIndex is out of range', async () => {
    mockSend.mockResolvedValueOnce({ Item: MOCK_CAT })
    const res = await handler(makeEvent('cat-1', '99'), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when trying to delete the only photo', async () => {
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, photos: [PHOTO_1] } })
    const res = await handler(makeEvent('cat-1', '0'), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 403 when user is neither cat owner nor photo uploader', async () => {
    // user-1 is authenticated but PHOTO_2 was uploaded by user-2,
    // and we swap cat owner to user-3 to ensure neither condition is met
    mockSend.mockResolvedValueOnce({
      Item: { ...MOCK_CAT, userId: 'user-3', photos: [PHOTO_1, PHOTO_2] },
    })
    // photo at index 1 belongs to user-2; authenticated user is user-1
    const res = await handler(makeEvent('cat-1', '1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(403)
  })

  it('allows cat owner to delete any photo', async () => {
    // user-1 owns the cat, deletes photo at index 1 (uploaded by user-2)
    const afterDelete = { ...MOCK_CAT, photos: [PHOTO_1] }
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })
      .mockResolvedValueOnce({ Attributes: afterDelete })
    const res = await handler(makeEvent('cat-1', '1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.photos).toHaveLength(1)
  })

  it('allows photo uploader to delete their own photo even if not cat owner', async () => {
    // Swap cat owner to user-3; authenticated user-1 uploaded PHOTO_1 (index 0)
    const catWithDifferentOwner = { ...MOCK_CAT, userId: 'user-3' }
    const afterDelete = { ...catWithDifferentOwner, photos: [PHOTO_2] }
    mockSend
      .mockResolvedValueOnce({ Item: catWithDifferentOwner })
      .mockResolvedValueOnce({ Attributes: afterDelete })
    const res = await handler(makeEvent('cat-1', '0'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
  })

  it('returns updated cat in response body after deletion', async () => {
    const afterDelete = { ...MOCK_CAT, photos: [PHOTO_1] }
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })
      .mockResolvedValueOnce({ Attributes: afterDelete })
    const res = await handler(makeEvent('cat-1', '1'), {} as any, () => {})
    const body = JSON.parse((res as any).body)
    expect(body.id).toBe('cat-1')
    expect(body.photos).toHaveLength(1)
    expect(body.photos[0].s3Key).toBe(PHOTO_1.s3Key)
  })
})
