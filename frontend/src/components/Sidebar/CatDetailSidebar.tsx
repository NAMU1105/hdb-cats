import type { Cat } from '../../types'

interface Props {
  cat: Cat | null
  loading: boolean
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CatDetailSidebar({ cat, loading, onClose }: Props) {
  const show = cat || loading

  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1000]
        transform transition-transform duration-300 ease-in-out
        ${show ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white">
        <h2 className="font-bold text-lg truncate">{cat?.title ?? 'Loading…'}</h2>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded hover:bg-red-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" />
          </div>
        )}

        {cat && !loading && (
          <>
            <img
              src={cat.cdnUrl}
              alt={cat.title}
              className="w-full aspect-square object-cover"
            />
            <div className="p-4 space-y-3">
              {cat.description && (
                <p className="text-gray-700 text-sm leading-relaxed">{cat.description}</p>
              )}

              <div className="space-y-1 text-sm text-gray-500">
                {cat.hdbBlock && (
                  <div className="flex items-center gap-1">
                    <span>🏢</span>
                    <span>
                      Blk {cat.hdbBlock}
                      {cat.town ? `, ${cat.town}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>
                    {cat.latitude.toFixed(5)}, {cat.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Spotted {formatDate(cat.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
