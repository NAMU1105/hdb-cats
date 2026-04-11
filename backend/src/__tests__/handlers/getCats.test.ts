import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

// vi.hoisted ensures this runs before vi.mock factories (which are hoisted to the top)
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('../../lib/dynamo', () => ({
  ddb: { send: mockSend },
  TABLE_NAME: 'test-table',
  PK: 'CAT',
}))

import { handler } from '../../handlers/getCats'

const MOCK_ITEMS = [
  {
    id: 'cat-1', title: 'Milo', latitude: 1.35, longitude: 103.82,
    thumbUrl: 'https://cdn/thumb.jpg', uploadedAt: '2026-04-12T00:00:00Z',
    town: 'Bedok', hdbBlock: '123',
  },
]

function makeEvent(qs: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return {
    queryStringParameters: qs,
    requestContext: { http: { method: 'GET' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('getCats handler', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({ Items: MOCK_ITEMS, LastEvaluatedKey: undefined })
  })

  it('returns list of cats with nextCursor null when no more pages', async () => {
    const res = await handler(makeEvent(), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    const body = JSON.parse((res as any).body)
    expect(body.items).toHaveLength(1)
    expect(body.nextCursor).toBeNull()
  })

  it('returns nextCursor when DynamoDB has more pages', async () => {
    mockSend.mockResolvedValueOnce({
      Items: MOCK_ITEMS,
      LastEvaluatedKey: { PK: 'CAT', SK: 'CAT#cat-1' },
    })
    const res = await handler(makeEvent(), {} as any, () => {})
    const body = JSON.parse((res as any).body)
    expect(typeof body.nextCursor).toBe('string')
  })

  it('returns 400 for a malformed cursor', async () => {
    const res = await handler(makeEvent({ cursor: 'not-valid-base64!!!' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('rejects a cursor with unexpected keys', async () => {
    // The schema whitelist only allows PK, SK, town, uploadedAt
    const withExtraKey = Buffer.from(JSON.stringify({ PK: 'CAT', injected: 'evil' })).toString('base64')
    const res = await handler(makeEvent({ cursor: withExtraKey }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('uses GSI when town filter is provided', async () => {
    await handler(makeEvent({ town: 'Bedok' }), {} as any, () => {})
    const sentParams = mockSend.mock.calls[0][0].input
    expect(sentParams.IndexName).toBe('TownIndex')
  })
})
