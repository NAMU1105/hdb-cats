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

import { handler } from '../../handlers/toggleLike'

const MOCK_CAT = {
  id: 'cat-1',
  title: 'Orange Tom',
  status: 'active',
  userId: 'other-user',
  likeCount: 2,
}

function makeEvent(id: string | undefined, authHeader = 'Bearer valid-token'): APIGatewayProxyEventV2 {
  return {
    pathParameters: id ? { id } : {},
    headers: { authorization: authHeader },
    requestContext: { http: { method: 'POST' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('toggleLike handler', () => {
  beforeEach(() => mockSend.mockReset())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(
      { requestContext: { http: { method: 'OPTIONS' } } } as any,
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent('cat-1', ''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent(undefined), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 404 when cat does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('returns 404 when cat is soft-deleted', async () => {
    mockSend.mockResolvedValueOnce({ Item: { ...MOCK_CAT, status: 'deleted' } })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(404)
  })

  it('likes a cat the user has not liked yet', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })   // get cat
      .mockResolvedValueOnce({ Item: undefined })    // get like — not found
      .mockResolvedValueOnce({})                     // put like
      .mockResolvedValueOnce({ Attributes: { likeCount: 3 } })  // update count
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.likedByMe).toBe(true)
    expect(body.likeCount).toBe(3)
  })

  it('unlikes a cat the user has already liked', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: MOCK_CAT })
      .mockResolvedValueOnce({ Item: { PK: 'CAT', SK: 'LIKE#cat-1#user-1' } })  // already liked
      .mockResolvedValueOnce({})                                                    // delete like
      .mockResolvedValueOnce({ Attributes: { likeCount: 1 } })
    const res = await handler(makeEvent('cat-1'), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.likedByMe).toBe(false)
    expect(body.likeCount).toBe(1)
  })
})
