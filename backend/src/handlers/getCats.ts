import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import type { CatItem, CatListItem } from '../types/index'

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const qs = event.queryStringParameters ?? {}
  const town = qs.town
  const limit = Math.min(parseInt(qs.limit ?? '200', 10), 500)
  const cursor = qs.cursor ? JSON.parse(Buffer.from(qs.cursor, 'base64').toString()) as Record<string, unknown> : undefined

  let result
  if (town) {
    // Use GSI to filter by town
    result = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'TownIndex',
      KeyConditionExpression: 'town = :town',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':town': town, ':active': 'active' },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: cursor,
    }))
  } else {
    result = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':pk': PK, ':prefix': 'CAT#', ':active': 'active' },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: cursor,
    }))
  }

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

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null

  return ok({ items, nextCursor })
}
