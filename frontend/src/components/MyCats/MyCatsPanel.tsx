import { useEffect, useState } from 'react'
import { fetchMyCats } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import type { CatListItem } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSelectCat: (id: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function MyCatsPanel({ open, onClose, onSelectCat }: Props) {
  const { user } = useAuth()
  const [cats, setCats] = useState<CatListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    setError(null)
    fetchMyCats(user.credential)
      .then(setCats)
      .catch(() => setError('Failed to load your cats'))
      .finally(() => setLoading(false))
  }, [open, user])

  const handleSelect = (id: string) => {
    onClose()
    onSelectCat(id)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[998] bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[999]
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white shrink-0">
          <h2 className="font-bold text-lg">🐾 My Cats</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-700 transition-colors"
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

          {error && !loading && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-200">{error}</div>
          )}

          {!loading && !error && cats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <span className="text-4xl">🐱</span>
              <p className="text-sm">No cats spotted yet</p>
              <p className="text-xs text-gray-300">Hit "Spot a Cat" to add one!</p>
            </div>
          )}

          {!loading && cats.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {cats.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleSelect(cat.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <img
                      src={cat.thumbUrl}
                      alt={cat.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{cat.title}</p>
                      {(cat.hdbBlock || cat.town) && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {cat.hdbBlock ? `Blk ${cat.hdbBlock}` : ''}
                          {cat.hdbBlock && cat.town ? ', ' : ''}
                          {cat.town ?? ''}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(cat.uploadedAt)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && cats.length > 0 && (
          <div className="border-t p-3 shrink-0">
            <p className="text-xs text-center text-gray-400">
              {cats.length} {cats.length === 1 ? 'cat' : 'cats'} spotted
            </p>
          </div>
        )}
      </div>
    </>
  )
}
