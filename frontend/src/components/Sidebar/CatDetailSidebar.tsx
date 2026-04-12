import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateCat, deleteCat } from '../../api/client'
import type { Cat } from '../../types'

interface Props {
  cat: Cat | null
  loading: boolean
  onClose: () => void
  onDeleted: (id: string) => void
  onUpdated: (cat: Cat) => void
}

type Mode = 'view' | 'edit' | 'confirm-delete'

interface EditForm {
  title: string
  description: string
  hdbBlock: string
  town: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CatDetailSidebar({ cat, loading, onClose, onDeleted, onUpdated }: Props) {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('view')
  const [form, setForm] = useState<EditForm>({ title: '', description: '', hdbBlock: '', town: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cat) {
      setForm({
        title: cat.title,
        description: cat.description ?? '',
        hdbBlock: cat.hdbBlock ?? '',
        town: cat.town ?? '',
      })
      setMode('view')
      setError(null)
    }
  }, [cat?.id])

  const show = cat || loading

  const handleSave = async () => {
    if (!cat || !user) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateCat(
        cat.id,
        {
          title: form.title,
          description: form.description || undefined,
          hdbBlock: form.hdbBlock || undefined,
          town: form.town || undefined,
        },
        user.credential,
      )
      onUpdated(updated)
      setMode('view')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!cat || !user) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCat(cat.id, user.credential)
      onDeleted(cat.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const headerTitle = mode === 'edit' ? 'Edit Details' : (cat?.title ?? 'Loading…')

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
        <h2 className="font-bold text-lg truncate">{headerTitle}</h2>
        <button
          onClick={mode === 'edit' ? () => { setMode('view'); setError(null) } : onClose}
          className="ml-2 p-1 rounded hover:bg-red-700 transition-colors"
          aria-label={mode === 'edit' ? 'Cancel edit' : 'Close'}
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
            {mode !== 'edit' && (
              <img src={cat.cdnUrl} alt={cat.title} className="w-full aspect-square object-cover" />
            )}

            <div className="p-4 space-y-3">
              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
              )}

              {mode === 'view' && (
                <>
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
                </>
              )}

              {mode === 'edit' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">HDB Block</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={form.hdbBlock}
                      onChange={(e) => setForm((f) => ({ ...f, hdbBlock: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Town</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={form.town}
                      onChange={(e) => setForm((f) => ({ ...f, town: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {mode === 'confirm-delete' && (
                <div className="bg-red-50 border border-red-200 rounded p-3 space-y-1">
                  <p className="text-sm text-red-700 font-medium">Delete this cat?</p>
                  <p className="text-xs text-red-500">This action cannot be undone.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer actions — only shown when logged in */}
      {cat && !loading && user && (
        <div className="border-t p-3">
          {mode === 'view' && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode('edit')}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => { setMode('confirm-delete'); setError(null) }}
                className="flex-1 py-2 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('view'); setError(null) }}
                disabled={saving}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}

          {mode === 'confirm-delete' && (
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('view'); setError(null) }}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
