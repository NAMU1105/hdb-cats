import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('../../lib/dynamo', () => ({
  ddb: { send: vi.fn().mockResolvedValue({}) },
  TABLE_NAME: 'test-table',
  PK: 'CAT',
}))

import { handler } from '../../handlers/deleteCat'

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    headers: { 'x-admin-key': 'test-admin-key' },
    pathParameters: { id: 'abc123' },
    requestContext: { http: { method: 'DELETE' } },
    ...overrides,
  } as unknown as APIGatewayProxyEventV2
}

describe('deleteCat handler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await handler(makeEvent({ requestContext: { http: { method: 'OPTIONS' } } as any }), {} as any, () => {})
    expect((res as any).statusCode).toBe(204)
  })

  it('returns 403 when admin key is wrong', async () => {
    const res = await handler(makeEvent({ headers: { 'x-admin-key': 'wrong' } }), {} as any, () => {})
    expect((res as any).statusCode).toBe(403)
  })

  it('returns 403 when admin key header is missing', async () => {
    const res = await handler(makeEvent({ headers: {} }), {} as any, () => {})
    expect((res as any).statusCode).toBe(403)
  })

  it('returns 400 when cat id is missing', async () => {
    const res = await handler(makeEvent({ pathParameters: {} }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('soft-deletes and returns 200 on valid request', async () => {
    const res = await handler(makeEvent(), {} as any, () => {})
    expect((res as any).statusCode).toBe(200)
    expect(JSON.parse((res as any).body)).toMatchObject({ message: 'Cat removed' })
  })
})
