import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import { normalizePhotos, toCatPublic } from '../lib/cat'
import type { CatItem } from '../types/index'

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const user = await verifyGoogleToken(event.headers['authorization'])
  if (!user) return err('Unauthorized', 401)

  const catId = event.pathParameters?.id
  const indexStr = event.pathParameters?.photoIndex
  if (!catId) return err('Missing cat id', 400)
  if (indexStr === undefined) return err('Missing photo index', 400)

  const photoIndex = parseInt(indexStr, 10)
  if (isNaN(photoIndex) || photoIndex < 0) return err('Invalid photo index', 400)

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${catId}` } }),
  )
  if (!existing.Item) return err('Cat not found', 404)
  const item = existing.Item as CatItem
  if (item.status === 'deleted') return err('Cat not found', 404)

  const photos = normalizePhotos(item)

  if (photoIndex >= photos.length) return err('Photo index out of range', 400)
  if (photos.length === 1) return err('Cannot delete the only photo', 400)

  // Only the cat owner OR the uploader of that specific photo may delete it
  const targetPhoto = photos[photoIndex]
  const isCatOwner = item.userId === user.userId
  const isPhotoUploader = targetPhoto.userId === user.userId
  if (!isCatOwner && !isPhotoUploader) return err('Forbidden', 403)

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK: `CAT#${catId}` },
      // DynamoDB REMOVE on a list element: photos[N]
      UpdateExpression: `REMOVE photos[${photoIndex}]`,
      ReturnValues: 'ALL_NEW',
    }),
  )

  const updated = result.Attributes as CatItem
  return ok(toCatPublic(updated))
}
