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

import { handler } from '../../handlers/addCatPhoto'

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
}

const VALID_BODY = {
  imageKey: 'uploads/cat-1/photo-2.jpg',
  thumbKey: 'uploads/cat-1/thumb-2.jpg',
}

function makeEvent(
  id: string | undefined,
  body: object,
  authHeader = 'Bearer valid-token',
): APIGatewayProxyEventV2 {
  return {
    pathParameters: id ? { id } : {},
    headers: { authorization: authHeader },
    body: JSON.stringify(body),
    requestContext: { http: { method: 'POST' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('addCatPhoto handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent('cat-1', VALID_BODY, ''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent(undefined, VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when imageKey is missing', async () => {
    const res = await handler(
      makeEvent('cat-1', { thumbKey: 'uploads/cat-1/thumb-2.jpg' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when body is invalid JSON', async () => {
    const res = await handler(
      {
        pathParameters: { id: 'cat-1' },
        headers: { authorization: 'Bearer valid-token' },
        body: '{{not-json',
        requestContext: { http: { method: 'POST' } },
      } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 404 when cat does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(makeEvent('cat-1', VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 404 when cat is deleted', async () => {
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, status: 'deleted' } })
    const res = await handler(makeEvent('cat-1', VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 201 with updated cat on valid request', async () => {
    const updatedPhotos = [
      { s3Key: MOCK_CAT.imageKey, thumbKey: MOCK_CAT.thumbKey, cdnUrl: MOCK_CAT.cdnUrl, thumbUrl: MOCK_CAT.thumbUrl, uploadedAt: MOCK_CAT.uploadedAt, userId: 'user-1' },
      { s3Key: VALID_BODY.imageKey, thumbKey: VALID_BODY.thumbKey, cdnUrl: 'https://cdn.test/uploads/cat-1/photo-2.jpg', thumbUrl: 'https://cdn.test/uploads/cat-1/thumb-2.jpg', uploadedAt: expect.any(String), userId: 'user-1' },
    ]
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })                              // get cat
      .mockResolvedValueOnce({ Attributes: { ...MOCK_CAT, photos: updatedPhotos } })  // update
    const res = await handler(makeEvent('cat-1', VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(201)
    const body = JSON.parse((res as any).body)
    expect(body.photos).toHaveLength(2)
  })
})
