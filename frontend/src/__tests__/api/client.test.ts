import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

import {
  fetchCats,
  fetchMyCats,
  fetchCat,
  toggleLike,
  getUploadUrl,
  createCat,
  updateCat,
  deleteCat,
  addCatPhoto,
  uploadToS3,
} from '../../api/client'

const CAT_LIST_ITEM = {
  id: 'cat-1', title: 'Milo', latitude: 1.35, longitude: 103.82,
  thumbUrl: 'https://cdn/thumb.jpg', uploadedAt: '2026-04-12T00:00:00Z',
}

const CAT_DETAIL = {
  ...CAT_LIST_ITEM,
  imageKey: 'uploads/cat-1/original.jpg',
  cdnUrl: 'https://cdn/original.jpg',
  status: 'active',
  likeCount: 2,
  photos: [],
}

describe('fetchCats', () => {
  beforeEach(() => mockFetch.mockReset())

  it('calls /cats and returns items', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ items: [CAT_LIST_ITEM], nextCursor: null }))
    const result = await fetchCats()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('cat-1')
  })

  it('appends ?town= when filter is provided', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ items: [], nextCursor: null }))
    await fetchCats('Bedok')
    expect(mockFetch.mock.calls[0][0]).toContain('town=Bedok')
  })
})

describe('fetchMyCats', () => {
  beforeEach(() => mockFetch.mockReset())

  it('calls /cats/me with Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ items: [CAT_LIST_ITEM], nextCursor: null }))
    const result = await fetchMyCats('my-token')
    expect(result).toHaveLength(1)
    expect(mockFetch.mock.calls[0][0]).toContain('/cats/me')
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token')
  })
})

describe('fetchCat', () => {
  beforeEach(() => mockFetch.mockReset())

  it('calls /cats/{id} and returns cat', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(CAT_DETAIL))
    const cat = await fetchCat('cat-1')
    expect(cat.id).toBe('cat-1')
  })

  it('sends Authorization header when token provided', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(CAT_DETAIL))
    await fetchCat('cat-1', 'user-token')
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer user-token')
  })

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ error: 'Not found' }, 404))
    await expect(fetchCat('no-such')).rejects.toThrow('API error 404')
  })
})

describe('toggleLike', () => {
  beforeEach(() => mockFetch.mockReset())

  it('POSTs to /cats/{id}/like and returns likeCount/likedByMe', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ likeCount: 5, likedByMe: true }))
    const result = await toggleLike('cat-1', 'user-token')
    expect(result.likedByMe).toBe(true)
    expect(result.likeCount).toBe(5)
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })
})

describe('getUploadUrl', () => {
  beforeEach(() => mockFetch.mockReset())

  it('POSTs to /upload-url with payload and returns presigned URLs', async () => {
    const urlResponse = {
      uploadUrl: 'https://s3/upload', thumbUploadUrl: 'https://s3/thumb',
      imageKey: 'uploads/cat-new/original.jpg', thumbKey: 'uploads/cat-new/thumb.jpg', catId: 'cat-new',
    }
    mockFetch.mockResolvedValueOnce(makeResponse(urlResponse))
    const result = await getUploadUrl(
      { filename: 'cat.jpg', contentType: 'image/jpeg', fileSizeBytes: 500_000, thumbSizeBytes: 80_000 },
      'user-token',
    )
    expect(result.catId).toBe('cat-new')
    expect(result.uploadUrl).toBe('https://s3/upload')
  })
})

describe('createCat', () => {
  beforeEach(() => mockFetch.mockReset())

  it('POSTs to /cats and returns created cat', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(CAT_DETAIL))
    const cat = await createCat(
      {
        catId: 'cat-1', imageKey: 'uploads/cat-1/original.jpg', thumbKey: 'uploads/cat-1/thumb.jpg',
        title: 'Milo', latitude: 1.35, longitude: 103.82,
      },
      'user-token',
    )
    expect(cat.id).toBe('cat-1')
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })
})

describe('updateCat', () => {
  beforeEach(() => mockFetch.mockReset())

  it('PATCHes /cats/{id} with payload', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ...CAT_DETAIL, title: 'Updated Milo' }))
    const cat = await updateCat('cat-1', { title: 'Updated Milo' }, 'user-token')
    expect(cat.title).toBe('Updated Milo')
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH')
  })
})

describe('deleteCat', () => {
  beforeEach(() => mockFetch.mockReset())

  it('DELETEs /cats/{id}', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}))
    await deleteCat('cat-1', 'user-token')
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    expect(mockFetch.mock.calls[0][0]).toContain('/cats/cat-1')
  })
})

describe('addCatPhoto', () => {
  beforeEach(() => mockFetch.mockReset())

  it('POSTs to /cats/{id}/photos', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(CAT_DETAIL))
    await addCatPhoto('cat-1', 'uploads/cat-1/photo-2.jpg', 'uploads/cat-1/thumb-2.jpg', 'user-token')
    expect(mockFetch.mock.calls[0][0]).toContain('/cats/cat-1/photos')
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })
})

describe('uploadToS3', () => {
  beforeEach(() => mockFetch.mockReset())

  it('PUTs file directly to S3 presigned URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true } as Response)
    const blob = new Blob(['image-data'], { type: 'image/jpeg' })
    await uploadToS3('https://s3.presigned.url', blob, 'image/jpeg')
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
    expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('image/jpeg')
  })

  it('throws when S3 returns non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 } as Response)
    await expect(uploadToS3('https://s3.presigned.url', new Blob(), 'image/jpeg')).rejects.toThrow('S3 upload failed')
  })
})
