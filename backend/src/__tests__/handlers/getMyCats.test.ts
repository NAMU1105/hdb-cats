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

import { handler } from '../../handlers/getMyCats'

const MOCK_ITEMS = [
  {
    id: 'cat-1', title: 'My Orange Tom', latitude: 1.35, longitude: 103.82,
    thumbUrl: 'https://cdn.test/thumb.jpg', uploadedAt: '2026-04-12T00:00:00Z',
    town: 'Bedok', hdbBlock: '123A', userId: 'user-1',
  },
  {
    id: 'cat-2', title: 'My Tabby', latitude: 1.36, longitude: 103.83,
    thumbUrl: 'https://cdn.test/thumb2.jpg', uploadedAt: '2026-04-10T00:00:00Z',
    town: 'Tampines', userId: 'user-1',
  },
]

function makeEvent(authHeader = 'Bearer valid-token'): APIGatewayProxyEventV2 {
  return {
    headers: { authorization: authHeader },
    requestContext: { http: { method: 'GET' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('getMyCats handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent(''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 200 with empty list when user has no cats', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] })
    const res = await handler(makeEvent(), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    expect(JSON.parse((res as any).body).items).toHaveLength(0)
  })

  it('returns 200 with only CatListItem fields (no userId exposed)', async () => {
    mockSend.mockResolvedValueOnce({ Items: MOCK_ITEMS })
    const res = await handler(makeEvent(), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.items).toHaveLength(2)
    // Should not expose userId in list response
    expect(body.items[0].userId).toBeUndefined()
    expect(body.items[0].id).toBe('cat-1')
    expect(body.items[0].title).toBe('My Orange Tom')
  })

  it('queries using the UserIndex GSI', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] })
    await handler(makeEvent(), {} as any, () => {})
    const queryInput = mockSend.mock.calls[0][0].input
    expect(queryInput.IndexName).toBe('UserIndex')
    expect(queryInput.ExpressionAttributeValues[':uid']).toBe('user-1')
  })
})
