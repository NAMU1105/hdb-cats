import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Provide a logged-in user so submit() doesn't short-circuit
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { credential: 'fake-token', email: 'cat@hdb.sg' } }),
}))

vi.mock('../../api/client', () => ({
  getUploadUrl: vi.fn().mockResolvedValue({
    uploadUrl: 'https://s3/upload',
    thumbUploadUrl: 'https://s3/thumb-upload',
    imageKey: 'uploads/cat-1/original.jpg',
    thumbKey: 'uploads/cat-1/thumb.jpg',
    catId: 'cat-1',
  }),
  createCat: vi.fn().mockResolvedValue({ id: 'cat-1', title: 'Milo', status: 'active' }),
  uploadToS3: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../utils/imageOptimize', () => ({
  optimizeImages: vi.fn().mockResolvedValue({
    original: new Blob(['img'], { type: 'image/jpeg' }),
    thumb: new Blob(['th'], { type: 'image/jpeg' }),
    contentType: 'image/jpeg',
  }),
}))

import { useUpload } from '../../hooks/useUpload'

describe('useUpload state machine', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    onSuccess.mockReset()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    expect(result.current.step).toBe('idle')
  })

  it('openModal transitions to picking-image', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModal())
    expect(result.current.step).toBe('picking-image')
  })

  it('openModalAtLocation pre-sets location and transitions to picking-image', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModalAtLocation(1.35, 103.82))
    expect(result.current.step).toBe('picking-image')
    expect(result.current.location).toEqual([1.35, 103.82])
  })

  it('setFile skips picking-location when location is already set', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModalAtLocation(1.35, 103.82))
    act(() => result.current.setFile(new File([''], 'cat.jpg', { type: 'image/jpeg' })))
    // Should jump straight to filling-details, not picking-location
    expect(result.current.step).toBe('filling-details')
  })

  it('setFile goes to picking-location when no location is set', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModal())
    act(() => result.current.setFile(new File([''], 'cat.jpg', { type: 'image/jpeg' })))
    expect(result.current.step).toBe('picking-location')
  })

  it('closeModal resets to idle', () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModal())
    act(() => result.current.closeModal())
    expect(result.current.step).toBe('idle')
  })

  it('submit completes the upload flow and calls onSuccess', async () => {
    const { result } = renderHook(() => useUpload(onSuccess))
    act(() => result.current.openModal())
    act(() => result.current.setFile(new File([''], 'cat.jpg', { type: 'image/jpeg' })))
    act(() => result.current.setLocation(1.35, 103.82))
    act(() => result.current.setField('title', 'Milo'))

    await act(() => result.current.submit())

    expect(result.current.step).toBe('success')
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-1' }))
  })
})
