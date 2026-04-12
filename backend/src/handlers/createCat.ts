import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { buildCdnUrl } from '../lib/s3'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import { toCatPublic } from '../lib/cat'
import { isWithinSingapore } from '../types/index'
import type { CatItem } from '../types/index'

interface RequestBody {
  catId: string
  imageKey: string
  thumbKey: string
  title: string
  description?: string
  hdbBlock?: string
  town?: string
  latitude: number
  longitude: number
}

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

  const { catId, imageKey, thumbKey, title, description, hdbBlock, town, latitude, longitude } = body

  if (!catId || !imageKey || !thumbKey || !title?.trim()) {
    return err('catId, imageKey, thumbKey, and title are required')
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return err('latitude and longitude must be numbers')
  }
  if (!isWithinSingapore(latitude, longitude)) {
    return err('Location must be within Singapore')
  }

  const now = new Date().toISOString()
  const cdnUrl = buildCdnUrl(imageKey)
  const thumbUrl = buildCdnUrl(thumbKey)

  const item: CatItem = {
    PK,
    SK: `CAT#${catId}`,
    id: catId,
    title: title.trim(),
    description: description?.trim(),
    hdbBlock: hdbBlock?.trim(),
    town: town?.trim(),
    latitude,
    longitude,
    imageKey,
    thumbKey,
    cdnUrl,
    thumbUrl,
    uploadedAt: now,
    status: 'active',
    userId: user.userId,
    photos: [{ s3Key: imageKey, thumbKey, cdnUrl, thumbUrl, uploadedAt: now, userId: user.userId }],
  }

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

  return ok(toCatPublic(item), 201)
}
