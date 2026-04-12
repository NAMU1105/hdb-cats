import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import { toCatPublic } from '../lib/cat'
import type { CatItem } from '../types/index'

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

  // If auth header present, include whether this user has liked the cat
  const user = await verifyGoogleToken(event.headers['authorization']).catch(() => null)
  let likedByMe: boolean | undefined
  if (user) {
    const likeResult = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `LIKE#${id}#${user.userId}` } }),
    )
    likedByMe = !!likeResult.Item
  }

  return ok(toCatPublic(item, undefined, likedByMe))
}
