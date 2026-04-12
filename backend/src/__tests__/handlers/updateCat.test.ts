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

import { handler } from '../../handlers/updateCat'

const MOCK_CAT = {
  id: 'cat-1',
  title: 'Orange Tom',
  description: 'A chonky orange cat',
  hdbBlock: '123A',
  town: 'Bedok',
  latitude: 1.3521,
  longitude: 103.8198,
  imageKey: 'uploads/cat-1/original.jpg',
  thumbKey: 'uploads/cat-1/thumb.jpg',
  cdnUrl: 'https://cdn.test/original.jpg',
  thumbUrl: 'https://cdn.test/thumb.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active',
  userId: 'user-1',
  likeCount: 3,
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
    requestContext: { http: { method: 'PATCH' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('updateCat handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent('cat-1', { title: 'New Name' }, ''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent(undefined, { title: 'x' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when title is empty string', async () => {
    const res = await handler(makeEvent('cat-1', { title: '  ' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when body is invalid JSON', async () => {
    const res = await handler(
      {
        pathParameters: { id: 'cat-1' },
        headers: { authorization: 'Bearer valid-token' },
        body: 'not json{{{',
        requestContext: { http: { method: 'PATCH' } },
      } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when no updatable fields are provided', async () => {
    mockSend.mockResolvedValueOnce({ Item: MOCK_CAT })
    const res = await handler(makeEvent('cat-1', {}), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 404 when cat does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(makeEvent('cat-1', { title: 'New Name' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 403 when requester is not the owner', async () => {
    // token resolves to user-1 but cat.userId is 'user-2'
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, userId: 'user-2' } })
    const res = await handler(makeEvent('cat-1', { title: 'New Name' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(403)
  })

  it('returns 200 and updated cat on valid title update', async () => {
    const updatedCat = { ...MOCK_CAT, title: 'Renamed Cat' }
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })           // get existing
      .mockResolvedValueOnce({ Attributes: updatedCat })   // update
    const res = await handler(makeEvent('cat-1', { title: 'Renamed Cat' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    expect(JSON.parse((res as any).body).title).toBe('Renamed Cat')
  })

  it('clears optional fields when set to empty string', async () => {
    const updatedCat = { ...MOCK_CAT, description: undefined, hdbBlock: undefined }
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })
      .mockResolvedValueOnce({ Attributes: updatedCat })
    const res = await handler(
      makeEvent('cat-1', { description: '', hdbBlock: '' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(200)
    // Verify the UpdateExpression included REMOVE (check DynamoDB was called with correct params)
    const updateInput = mockSend.mock.calls[1][0].input
    expect(updateInput.UpdateExpression).toContain('REMOVE')
  })
})
