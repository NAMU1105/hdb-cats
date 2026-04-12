import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatFileSize, optimizeImages } from '../../utils/imageOptimize'

describe('formatFileSize', () => {
  it('formats bytes as-is under 1 KB', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats kilobytes with one decimal place', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 2.5)).toBe('2.5 KB')
    expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB')
  })

  it('formats megabytes with one decimal place', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 5.7)).toBe('5.7 MB')
  })
})

describe('optimizeImages', () => {
  beforeEach(() => {
    // jsdom does not implement HTMLCanvasElement.toBlob — stub it
    const mockBlob = new Blob(['img'], { type: 'image/jpeg' })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as any)

    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (callback) { callback(mockBlob) },
    )

    // Make Image onload fire synchronously with a fake size
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      const img = {
        width: 2000,
        height: 1500,
        set src(_url: string) {
          // Fire onload synchronously
          setTimeout(() => (this as any).onload?.(), 0)
        },
        onload: null as (() => void) | null,
        onerror: null,
      }
      return img as unknown as HTMLImageElement
    })
  })

  it('returns an object with original, thumb and contentType', async () => {
    const file = new File(['fake-image-data'], 'cat.jpg', { type: 'image/jpeg' })
    const result = await optimizeImages(file)
    expect(result.contentType).toBe('image/jpeg')
    expect(result.original).toBeInstanceOf(Blob)
    expect(result.thumb).toBeInstanceOf(Blob)
  })
})
