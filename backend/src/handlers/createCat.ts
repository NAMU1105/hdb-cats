import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { buildCdnUrl } from '../lib/s3'
import { err, ok, options } from '../lib/response'
import { isWithinSingapore } from '../types/index'
import type { CatItem, CatPublic } from '../types/index'

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
    cdnUrl: buildCdnUrl(imageKey),
    thumbUrl: buildCdnUrl(thumbKey),
    uploadedAt: now,
    status: 'active',
  }

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

  const response: CatPublic = {
    id: item.id,
    title: item.title,
    description: item.description,
    hdbBlock: item.hdbBlock,
    town: item.town,
    latitude: item.latitude,
    longitude: item.longitude,
    imageKey: item.imageKey,
    cdnUrl: item.cdnUrl,
    thumbUrl: item.thumbUrl,
    uploadedAt: item.uploadedAt,
    status: item.status,
  }

  return ok(response, 201)
}
