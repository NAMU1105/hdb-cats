import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import type { CatItem, CatListItem } from '../types/index'

const CURSOR_ALLOWED_KEYS = new Set(['PK', 'SK', 'town', 'uploadedAt'])

function parseCursor(raw: string): Record<string, string | number> | undefined {
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString())
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) return undefined
    for (const [k, v] of Object.entries(decoded)) {
      if (!CURSOR_ALLOWED_KEYS.has(k)) return undefined
      if (typeof v !== 'string' && typeof v !== 'number') return undefined
    }
    return decoded as Record<string, string | number>
  } catch {
    return undefined
  }
}

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') return options()

  const qs = event.queryStringParameters ?? {}
  const town = qs.town
  const limit = Math.min(parseInt(qs.limit ?? '200', 10), 500)
  const cursor = qs.cursor ? parseCursor(qs.cursor) : undefined
  if (qs.cursor && !cursor) return err('Invalid cursor', 400)

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
