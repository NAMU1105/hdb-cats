import { describe, it, expect } from 'vitest'
import { ok, err, options } from '../../lib/response'

describe('response helpers', () => {
  describe('ok()', () => {
    it('returns 200 with JSON body by default', () => {
      const res = ok({ id: '1' })
      expect(res.statusCode).toBe(200)
      expect(res.body).toBe('{"id":"1"}')
    })

    it('accepts a custom status code', () => {
      const res = ok({}, 201)
      expect(res.statusCode).toBe(201)
    })

    it('includes security headers', () => {
      const res = ok({})
      const headers = res.headers as Record<string, string>
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['Strict-Transport-Security']).toMatch(/max-age=/)
    })

    it('includes CORS headers', () => {
      const res = ok({})
      const headers = res.headers as Record<string, string>
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
    })
  })

  describe('err()', () => {
    it('returns 400 with error message by default', () => {
      const res = err('bad input')
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.body as string)).toEqual({ error: 'bad input' })
    })

    it('accepts a custom status code', () => {
      const res = err('forbidden', 403)
      expect(res.statusCode).toBe(403)
    })
  })

  describe('options()', () => {
    it('returns 204 with empty body', () => {
      const res = options()
      expect(res.statusCode).toBe(204)
      expect(res.body).toBe('')
    })
  })
})
