import type { APIGatewayProxyResultV2 } from 'aws-lambda'

const origin = process.env.ALLOWED_ORIGIN
if (!origin) throw new Error('ALLOWED_ORIGIN environment variable is not set')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-admin-key',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

export function ok(body: unknown, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...SECURITY_HEADERS },
    body: JSON.stringify(body),
  }
}

export function err(message: string, statusCode = 400): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...SECURITY_HEADERS },
    body: JSON.stringify({ error: message }),
  }
}

export function options(): APIGatewayProxyResultV2 {
  return { statusCode: 204, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS }, body: '' }
}
