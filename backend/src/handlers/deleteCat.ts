import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'

const ADMIN_KEY = process.env.ADMIN_API_KEY ?? ''

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  // Simple API key guard
  if (ADMIN_KEY && event.headers['x-admin-key'] !== ADMIN_KEY) {
    return err('Forbidden', 403)
  }

  const id = event.pathParameters?.id
  if (!id) return err('Missing cat id', 400)

  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK, SK: `CAT#${id}` },
    UpdateExpression: 'SET #status = :deleted',
    ConditionExpression: 'attribute_exists(PK)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':deleted': 'deleted' },
  }))

  return ok({ message: 'Cat removed' })
}
