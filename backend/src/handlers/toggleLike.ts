import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem } from '../types/index'

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const user = await verifyGoogleToken(event.headers['authorization'])
  if (!user) return err('Unauthorized', 401)

  const id = event.pathParameters?.id
  if (!id) return err('Missing cat id', 400)

  // Verify cat exists and is active
  const catResult = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${id}` } }),
  )
  if (!catResult.Item) return err('Cat not found', 404)
  const cat = catResult.Item as CatItem
  if (cat.status === 'deleted') return err('Cat not found', 404)

  const likeSK = `LIKE#${id}#${user.userId}`

  // Check if already liked
  const likeResult = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: likeSK } }),
  )

  if (likeResult.Item) {
    // Unlike: remove like item and decrement counter
    await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK, SK: likeSK } }))
    const updated = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK: `CAT#${id}` },
        UpdateExpression: 'ADD likeCount :dec',
        ExpressionAttributeValues: { ':dec': -1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    )
    return ok({ likeCount: Math.max(0, (updated.Attributes?.likeCount as number) ?? 0), likedByMe: false })
  } else {
    // Like: create like item and increment counter
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { PK, SK: likeSK, catId: id, userId: user.userId, likedAt: new Date().toISOString() },
      }),
    )
    const updated = await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK: `CAT#${id}` },
        UpdateExpression: 'ADD likeCount :inc',
        ExpressionAttributeValues: { ':inc': 1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    )
    return ok({ likeCount: (updated.Attributes?.likeCount as number) ?? 1, likedByMe: true })
  }
}
