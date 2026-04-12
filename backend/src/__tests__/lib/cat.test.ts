import { describe, it, expect } from 'vitest'
import { normalizePhotos, toCatPublic } from '../../lib/cat'
import type { CatItem } from '../../types/index'

const LEGACY_ITEM: CatItem = {
  PK: 'CAT',
  SK: 'CAT#cat-1',
  id: 'cat-1',
  title: 'Orange Tom',
  latitude: 1.3521,
  longitude: 103.8198,
  imageKey: 'uploads/cat-1/original.jpg',
  thumbKey: 'uploads/cat-1/thumb.jpg',
  cdnUrl: 'https://cdn.test/uploads/cat-1/original.jpg',
  thumbUrl: 'https://cdn.test/uploads/cat-1/thumb.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active',
  userId: 'user-1',
  likeCount: 3,
}

const PHOTO = {
  s3Key: 'uploads/cat-1/photo-2.jpg',
  thumbKey: 'uploads/cat-1/thumb-2.jpg',
  cdnUrl: 'https://cdn.test/uploads/cat-1/photo-2.jpg',
  thumbUrl: 'https://cdn.test/uploads/cat-1/thumb-2.jpg',
  uploadedAt: '2026-04-13T00:00:00Z',
  userId: 'user-2',
}

describe('normalizePhotos', () => {
  it('returns photos array when item already has a photos field', () => {
    const item = { ...LEGACY_ITEM, photos: [PHOTO] }
    expect(normalizePhotos(item)).toEqual([PHOTO])
  })

  it('returns empty photos array as-is (no fallback for empty array)', () => {
    const item = { ...LEGACY_ITEM, photos: [] }
    // Empty array is falsy-length so falls through to legacy path
    const result = normalizePhotos(item)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)  // falls back to legacy single photo
  })

  it('synthesises a single photo from legacy flat fields', () => {
    const result = normalizePhotos(LEGACY_ITEM)
    expect(result).toHaveLength(1)
    expect(result[0].cdnUrl).toBe(LEGACY_ITEM.cdnUrl)
    expect(result[0].thumbUrl).toBe(LEGACY_ITEM.thumbUrl)
    expect(result[0].s3Key).toBe(LEGACY_ITEM.imageKey)
    expect(result[0].thumbKey).toBe(LEGACY_ITEM.thumbKey)
    expect(result[0].userId).toBe(LEGACY_ITEM.userId)
    expect(result[0].uploadedAt).toBe(LEGACY_ITEM.uploadedAt)
  })
})

describe('toCatPublic', () => {
  it('includes likeCount from item when not overridden', () => {
    const result = toCatPublic(LEGACY_ITEM)
    expect(result.likeCount).toBe(3)
  })

  it('uses override likeCount when provided', () => {
    const result = toCatPublic(LEGACY_ITEM, 10)
    expect(result.likeCount).toBe(10)
  })

  it('defaults likeCount to 0 when item has no likeCount', () => {
    const item = { ...LEGACY_ITEM, likeCount: undefined }
    expect(toCatPublic(item).likeCount).toBe(0)
  })

  it('sets likedByMe when provided', () => {
    expect(toCatPublic(LEGACY_ITEM, undefined, true).likedByMe).toBe(true)
    expect(toCatPublic(LEGACY_ITEM, undefined, false).likedByMe).toBe(false)
  })

  it('likedByMe is undefined when not passed', () => {
    expect(toCatPublic(LEGACY_ITEM).likedByMe).toBeUndefined()
  })

  it('uses photos array from item when present', () => {
    const item = { ...LEGACY_ITEM, photos: [PHOTO] }
    const result = toCatPublic(item)
    expect(result.photos).toHaveLength(1)
    expect(result.photos[0].cdnUrl).toBe(PHOTO.cdnUrl)
  })

  it('exposes required public fields', () => {
    const result = toCatPublic(LEGACY_ITEM)
    expect(result).toMatchObject({
      id: 'cat-1',
      title: 'Orange Tom',
      latitude: 1.3521,
      longitude: 103.8198,
      status: 'active',
    })
  })
})
