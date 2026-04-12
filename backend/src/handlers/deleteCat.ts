import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem } from '../types/index'

const ADMIN_KEY = process.env.ADMIN_API_KEY ?? ''

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const id = event.pathParameters?.id
  if (!id) return err('Missing cat id', 400)

  const isAdmin = ADMIN_KEY && event.headers['x-admin-key'] === ADMIN_KEY

  if (!isAdmin) {
    // Fall back to Google OAuth ownership check
    const user = await verifyGoogleToken(event.headers['authorization'])
    if (!user) return err('Forbidden', 403)

    const existing = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${id}` } }),
    )
    if (!existing.Item) return err('Cat not found', 404)
    const item = existing.Item as CatItem
    if (item.status === 'deleted') return err('Cat not found', 404)
    if (item.userId !== user.userId) return err('Forbidden', 403)
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK: `CAT#${id}` },
      UpdateExpression: 'SET #status = :deleted',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':deleted': 'deleted' },
    }),
  )

  return ok({ message: 'Cat removed' })
}
