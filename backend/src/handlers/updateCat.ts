import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, PK, TABLE_NAME } from '../lib/dynamo'
import { err, ok, options } from '../lib/response'
import { verifyGoogleToken } from '../lib/auth'
import type { CatItem, CatPublic } from '../types/index'

interface RequestBody {
  title?: string
  description?: string
  hdbBlock?: string
  town?: string
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

  const { title, description, hdbBlock, town } = body
  if (title !== undefined && !title.trim()) return err('title cannot be empty')

  // Fetch existing item to verify ownership
  const existing = await ddb.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK, SK: `CAT#${id}` } }),
  )
  if (!existing.Item) return err('Cat not found', 404)
  const item = existing.Item as CatItem
  if (item.status === 'deleted') return err('Cat not found', 404)
  if (item.userId !== user.userId) return err('Forbidden', 403)

  const sets: string[] = []
  const removes: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (title !== undefined) {
    sets.push('#title = :title')
    names['#title'] = 'title'
    values[':title'] = title.trim()
  }
  if (description !== undefined) {
    const v = description.trim()
    if (v) {
      sets.push('#description = :description')
      names['#description'] = 'description'
      values[':description'] = v
    } else {
      removes.push('#description')
      names['#description'] = 'description'
    }
  }
  if (hdbBlock !== undefined) {
    const v = hdbBlock.trim()
    if (v) {
      sets.push('#hdbBlock = :hdbBlock')
      names['#hdbBlock'] = 'hdbBlock'
      values[':hdbBlock'] = v
    } else {
      removes.push('#hdbBlock')
      names['#hdbBlock'] = 'hdbBlock'
    }
  }
  if (town !== undefined) {
    const v = town.trim()
    if (v) {
      sets.push('#town = :town')
      names['#town'] = 'town'
      values[':town'] = v
    } else {
      removes.push('#town')
      names['#town'] = 'town'
    }
  }

  if (sets.length === 0 && removes.length === 0) return err('No fields to update')

  const updateParts: string[] = []
  if (sets.length > 0) updateParts.push(`SET ${sets.join(', ')}`)
  if (removes.length > 0) updateParts.push(`REMOVE ${removes.join(', ')}`)

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK, SK: `CAT#${id}` },
      UpdateExpression: updateParts.join(' '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: Object.keys(values).length > 0 ? values : undefined,
      ReturnValues: 'ALL_NEW',
    }),
  )

  const updated = result.Attributes as CatItem
  const response: CatPublic = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    hdbBlock: updated.hdbBlock,
    town: updated.town,
    latitude: updated.latitude,
    longitude: updated.longitude,
    imageKey: updated.imageKey,
    cdnUrl: updated.cdnUrl,
    thumbUrl: updated.thumbUrl,
    uploadedAt: updated.uploadedAt,
    status: updated.status,
  }

  return ok(response)
}
