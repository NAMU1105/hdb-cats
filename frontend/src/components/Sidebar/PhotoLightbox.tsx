import { useEffect } from 'react'
import type { Photo } from '../../types'

interface Props {
  photos: Photo[]
  index: number
  catTitle: string
  onClose: () => void
  onNavigate: (index: number) => void
}

export function PhotoLightbox({ photos, index, catTitle, onClose, onNavigate }: Props) {
  const photo = photos[index]
  const total = photos.length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < total - 1) onNavigate(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total, onClose, onNavigate])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Previous"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={photo.cdnUrl}
        alt={catTitle}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Next"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Date bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
        {new Date(photo.uploadedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}
