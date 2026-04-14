import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

const { mockFetchCat } = vi.hoisted(() => ({ mockFetchCat: vi.fn() }))
vi.mock('../../api/client', () => ({
  fetchCat: mockFetchCat,
}))

import { useSelectedCat } from '../../hooks/useSelectedCat'

const MOCK_CAT = {
  id: 'cat-1',
  title: 'Orange Tom',
  latitude: 1.35,
  longitude: 103.82,
  imageKey: 'uploads/cat-1/original.jpg',
  cdnUrl: 'https://cdn/original.jpg',
  thumbUrl: 'https://cdn/thumb.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active' as const,
  userId: 'user-1',
  likeCount: 2,
  photos: [],
}

describe('useSelectedCat', () => {
  beforeEach(() => {
    mockFetchCat.mockReset()
    mockFetchCat.mockResolvedValue(MOCK_CAT)
    // Clear any leftover ?cat= search param
    history.replaceState(null, '', '/')
  })

  it('starts with no cat selected and not loading', () => {
    const { result } = renderHook(() => useSelectedCat())
    expect(result.current.selectedCat).toBeNull()
    expect(result.current.loadingCat).toBe(false)
  })

  it('selectCat sets loading then resolves cat', async () => {
    const { result } = renderHook(() => useSelectedCat())
    act(() => { void result.current.selectCat('cat-1') })
    expect(result.current.loadingCat).toBe(true)
    await waitFor(() => expect(result.current.loadingCat).toBe(false))
    expect(result.current.selectedCat?.id).toBe('cat-1')
  })

  it('clearSelectedCat nulls out the selected cat', async () => {
    const { result } = renderHook(() => useSelectedCat())
    await act(() => result.current.selectCat('cat-1'))
    await waitFor(() => expect(result.current.selectedCat).not.toBeNull())
    act(() => result.current.clearSelectedCat())
    expect(result.current.selectedCat).toBeNull()
  })

  it('updateSelectedCat replaces the cat in state', async () => {
    const { result } = renderHook(() => useSelectedCat())
    await act(() => result.current.selectCat('cat-1'))
    await waitFor(() => expect(result.current.selectedCat).not.toBeNull())
    const updated = { ...MOCK_CAT, title: 'Renamed Cat' }
    act(() => result.current.updateSelectedCat(updated))
    expect(result.current.selectedCat?.title).toBe('Renamed Cat')
  })

  it('selectCat updates the URL with ?cat= param', async () => {
    const { result } = renderHook(() => useSelectedCat())
    await act(() => result.current.selectCat('cat-1'))
    await waitFor(() => expect(result.current.selectedCat).not.toBeNull())
    expect(window.location.search).toBe('?cat=cat-1')
  })

  it('clearSelectedCat removes the ?cat= param from URL', async () => {
    const { result } = renderHook(() => useSelectedCat())
    await act(() => result.current.selectCat('cat-1'))
    await waitFor(() => expect(result.current.selectedCat).not.toBeNull())
    act(() => result.current.clearSelectedCat())
    expect(window.location.search).toBe('')
  })
})
