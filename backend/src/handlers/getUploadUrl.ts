import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { ulid } from 'ulid'
import { BUCKET, buildCdnUrl, createPresignedPutUrl } from '../lib/s3'
import { err, ok, options } from '../lib/response'

interface RequestBody {
  filename: string
  contentType: string
  fileSizeBytes: number
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  let body: RequestBody
  try {
    body = JSON.parse(event.body ?? '{}') as RequestBody
  } catch {
    return err('Invalid JSON body')
  }

  const { filename, contentType, fileSizeBytes } = body

  if (!filename || !contentType || !fileSizeBytes) {
    return err('filename, contentType, and fileSizeBytes are required')
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return err(`Unsupported content type: ${contentType}`)
  }
  if (typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0 || fileSizeBytes > 10_000_000) {
    return err('fileSizeBytes must be between 1 and 10,000,000')
  }

  const catId = ulid()
  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
  const imageKey = `uploads/${catId}/original.${ext}`
  const thumbKey = `uploads/${catId}/thumb.${ext}`

  const [uploadUrl, thumbUploadUrl] = await Promise.all([
    createPresignedPutUrl(imageKey, contentType, fileSizeBytes),
    // Estimate thumb size as 20% of original for the content-length check
    createPresignedPutUrl(thumbKey, contentType, Math.max(1024, Math.floor(fileSizeBytes * 0.2))),
  ])

  return ok({
    uploadUrl,
    thumbUploadUrl,
    imageKey,
    thumbKey,
    catId,
    cdnDomain: buildCdnUrl('').replace(/\/$/, ''),
    bucket: BUCKET,
  })
}
