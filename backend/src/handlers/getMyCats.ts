import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem, CatListItem } from '../types/index'

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const googleUser = await verifyGoogleToken(event.headers['authorization'])
  if (!googleUser) return err('Unauthorized', 401)

  const result = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'UserIndex',
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: '#status = :active',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':uid': googleUser.userId, ':active': 'active' },
    ScanIndexForward: false,
  }))

  const items: CatListItem[] = ((result.Items ?? []) as CatItem[]).map((item) => ({
    id: item.id,
    title: item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    thumbUrl: item.thumbUrl,
    hdbBlock: item.hdbBlock,
    town: item.town,
    uploadedAt: item.uploadedAt,
  }))

  return ok({ items })
}
