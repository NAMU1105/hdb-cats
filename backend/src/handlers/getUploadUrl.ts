import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { ulid } from 'ulid'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { BUCKET, buildCdnUrl, createPresignedPutUrl } from '../lib/s3'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem } from '../types/index'

interface RequestBody {
  filename: string
  contentType: string
  fileSizeBytes: number
  thumbSizeBytes: number
  catId?: string  // if provided, generates keys under this existing cat (for adding photos)
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const user = await verifyGoogleToken(event.headers['authorization'])
  if (!user) return err('Unauthorized', 401)

  let body: RequestBody
  try {
    body = JSON.parse(event.body ?? '{}') as RequestBody
  } catch {
    return err('Invalid JSON body')
  }

  const { filename, contentType, fileSizeBytes, thumbSizeBytes, catId: existingCatId } = body

  if (!filename || !contentType || !fileSizeBytes || !thumbSizeBytes) {
    return err('filename, contentType, fileSizeBytes, and thumbSizeBytes are required')
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return err(`Unsupported content type: ${contentType}`)
  }
  if (typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0 || fileSizeBytes > 10_000_000) {
    return err('fileSizeBytes must be between 1 and 10,000,000')
  }
  if (typeof thumbSizeBytes !== 'number' || thumbSizeBytes <= 0 || thumbSizeBytes > 10_000_000) {
    return err('thumbSizeBytes must be between 1 and 10,000,000')
  }

  // When adding a photo to an existing cat, verify it exists and is active
  if (existingCatId) {
    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${existingCatId}` } }),
    )
    const item = existing.Item as CatItem | undefined
    if (!item || item.status === 'deleted') return err('Cat not found', 404)
  }

  const catId = existingCatId ?? ulid()
  const photoId = ulid()
  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]

  // New cats use uploads/${catId}/original.ext; additional photos use uploads/${catId}/${photoId}.ext
  const imageKey = existingCatId
    ? `uploads/${catId}/${photoId}.${ext}`
    : `uploads/${catId}/original.${ext}`
  const thumbKey = existingCatId
    ? `uploads/${catId}/${photoId}_thumb.${ext}`
    : `uploads/${catId}/thumb.${ext}`

  const [uploadUrl, thumbUploadUrl] = await Promise.all([
    createPresignedPutUrl(imageKey, contentType, fileSizeBytes),
    createPresignedPutUrl(thumbKey, contentType, thumbSizeBytes),
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
