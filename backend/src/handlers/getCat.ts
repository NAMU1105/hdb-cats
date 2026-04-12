import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem, CatPublic } from '../types/index'

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const id = event.pathParameters?.id
  if (!id) return err('Missing cat id', 400)

  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK: `CAT#${id}` },
  }))

  if (!result.Item) return err('Cat not found', 404)

  const item = result.Item as CatItem
  if (item.status === 'deleted') return err('Cat not found', 404)

  const cat: CatPublic = {
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
    likeCount: item.likeCount ?? 0,
  }

  // If auth header present, include whether this user has liked the cat
  const user = await verifyGoogleToken(event.headers['authorization']).catch(() => null)
  if (user) {
    const likeResult = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `LIKE#${id}#${user.userId}` } }),
    )
    cat.likedByMe = !!likeResult.Item
  }

  return ok(cat)
}
