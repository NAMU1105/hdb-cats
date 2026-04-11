import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      getPayload: () => ({ sub: 'user-1', email: 'user@test.com' }),
    }),
  })),
}))

vi.mock('../../lib/dynamo', () => ({
  ddb: { send: vi.fn().mockResolvedValue({}) },
  TABLE_NAME: 'test-table',
  PK: 'CAT',
}))

vi.mock('../../lib/s3', () => ({
  buildCdnUrl: (key: string) => `https://test.cloudfront.net/${key}`,
}))

import { handler } from '../../handlers/createCat'

const VALID_BODY = {
  catId: 'cat-001',
  imageKey: 'uploads/cat-001/original.jpg',
  thumbKey: 'uploads/cat-001/thumb.jpg',
  title: 'Orange Tom',
  latitude: 1.3521,
  longitude: 103.8198,
}

function makeEvent(body: object, authHeader = 'Bearer valid-token'): APIGatewayProxyEventV2 {
  return {
    headers: { authorization: authHeader },
    body: JSON.stringify(body),
    requestContext: { http: { method: 'POST' } },
  } as unknown as APIGatewayProxyEventV2
}

describe('createCat handler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const res = await handler(makeEvent(VALID_BODY, ''), {} as any, () => {})
    expect((res as any).statusCode).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    const res = await handler(makeEvent({ ...VALID_BODY, title: '' }), {} as any, () => {})
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when coordinates are outside Singapore', async () => {
    // Tokyo coordinates
    const res = await handler(
      makeEvent({ ...VALID_BODY, latitude: 35.6895, longitude: 139.6917 }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('returns 400 when latitude is not a number', async () => {
    const res = await handler(
      makeEvent({ ...VALID_BODY, latitude: 'one-point-three' }),
      {} as any, () => {},
    )
    expect((res as any).statusCode).toBe(400)
  })

  it('creates the cat and returns 201 on valid request', async () => {
    const res = await handler(makeEvent(VALID_BODY), {} as any, () => {})
    expect((res as any).statusCode).toBe(201)
    const body = JSON.parse((res as any).body)
    expect(body.id).toBe('cat-001')
    expect(body.title).toBe('Orange Tom')
    expect(body.status).toBe('active')
  })

  it('trims whitespace from title', async () => {
    const res = await handler(
      makeEvent({ ...VALID_BODY, title: '  Fluffy  ' }),
      {} as any, () => {},
    )
    expect(JSON.parse((res as any).body).title).toBe('Fluffy')
  })
})
