import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockFetchCats } = vi.hoisted(() => ({ mockFetchCats: vi.fn() }))
vi.mock('../../api/client', () => ({
  fetchCats: mockFetchCats,
}))

import { useCats } from '../../hooks/useCats'
import type { Cat } from '../../types'

const CAT_A = {
  id: 'cat-1', title: 'Milo', latitude: 1.35, longitude: 103.82,
  thumbUrl: 'https://cdn/thumb1.jpg', uploadedAt: '2026-04-12T00:00:00Z',
}
const CAT_B = {
  id: 'cat-2', title: 'Luna', latitude: 1.36, longitude: 103.83,
  thumbUrl: 'https://cdn/thumb2.jpg', uploadedAt: '2026-04-11T00:00:00Z',
}

describe('useCats', () => {
  beforeEach(() => {
    mockFetchCats.mockReset()
    mockFetchCats.mockResolvedValue([CAT_A, CAT_B])
  })

  it('starts in loading state with empty list', () => {
    const { result } = renderHook(() => useCats())
    expect(result.current.loading).toBe(true)
    expect(result.current.cats).toHaveLength(0)
  })

  it('populates cats after fetch resolves', async () => {
    const { result } = renderHook(() => useCats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cats).toHaveLength(2)
    expect(result.current.cats[0].id).toBe('cat-1')
  })

  it('sets error when fetch fails', async () => {
    mockFetchCats.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Network error')
    expect(result.current.cats).toHaveLength(0)
  })

  it('addCat prepends to the list', async () => {
    const { result } = renderHook(() => useCats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const newCat = { id: 'cat-3', title: 'Whiskers', latitude: 1.37, longitude: 103.84, thumbUrl: '', uploadedAt: '' }
    act(() => result.current.addCat(newCat))
    expect(result.current.cats[0].id).toBe('cat-3')
    expect(result.current.cats).toHaveLength(3)
  })

  it('removeCat filters out the cat by id', async () => {
    const { result } = renderHook(() => useCats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.removeCat('cat-1'))
    expect(result.current.cats).toHaveLength(1)
    expect(result.current.cats[0].id).toBe('cat-2')
  })

  it('updateCatInList patches title and location fields', async () => {
    const { result } = renderHook(() => useCats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const updated = {
      ...CAT_A,
      title: 'Milo Renamed',
      hdbBlock: '99A',
      town: 'Tampines',
      imageKey: '',
      cdnUrl: '',
      status: 'active' as const,
      userId: 'user-1',
      likeCount: 0,
      photos: [],
    } as Cat
    act(() => result.current.updateCatInList(updated))
    const found = result.current.cats.find((c) => c.id === 'cat-1')
    expect(found?.title).toBe('Milo Renamed')
    expect(found?.town).toBe('Tampines')
  })
})
