import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { buildCdnUrl } from '../lib/s3'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import { toCatPublic } from '../lib/cat'
import type { CatItem, Photo } from '../types/index'

interface RequestBody {
  imageKey: string
  thumbKey: string
}

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const user = await verifyGoogleToken(event.headers['authorization'])
  if (!user) return err('Unauthorized', 401)

  const id = event.pathParameters?.id
  if (!id) return err('Missing cat id', 400)

  let body: RequestBody
  try {
    body = JSON.parse(event.body ?? '{}') as RequestBody
  } catch {
    return err('Invalid JSON body')
  }

  const { imageKey, thumbKey } = body
  if (!imageKey || !thumbKey) return err('imageKey and thumbKey are required')

  // Verify cat exists and is active
  const existing = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${id}` } }),
  )
  if (!existing.Item) return err('Cat not found', 404)
  const item = existing.Item as CatItem
  if (item.status === 'deleted') return err('Cat not found', 404)

  const now = new Date().toISOString()
  const newPhoto: Photo = {
    s3Key: imageKey,
    thumbKey,
    cdnUrl: buildCdnUrl(imageKey),
    thumbUrl: buildCdnUrl(thumbKey),
    uploadedAt: now,
    userId: user.userId,
  }

  // list_append with if_not_exists handles legacy items that don't have a photos attribute yet
  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK: `CAT#${id}` },
      UpdateExpression: 'SET photos = list_append(if_not_exists(photos, :empty), :newPhoto)',
      ExpressionAttributeValues: {
        ':empty': [],
        ':newPhoto': [newPhoto],
      },
      ReturnValues: 'ALL_NEW',
    }),
  )

  const updated = result.Attributes as CatItem
  return ok(toCatPublic(updated), 201)
}
