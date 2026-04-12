import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateCat, deleteCat, toggleLike, addCatPhoto, getUploadUrl, uploadToS3 } from '../../api/client'
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
  const [liking, setLiking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [addingPhoto, setAddingPhoto] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setLikeCount(cat.likeCount)
      setLikedByMe(cat.likedByMe ?? false)
      setPhotoIndex(0)
      setAddingPhoto(false)
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

  const handleShare = async () => {
    if (!cat) return
    const url = `${window.location.origin}${window.location.pathname}?cat=${cat.id}`
    if (navigator.share) {
      await navigator.share({ title: cat.title, text: `Check out this cat spotted in Singapore!`, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleLike = async () => {
    if (!cat || !user || liking) return
    setLiking(true)
    try {
      const result = await toggleLike(cat.id, user.credential)
      setLikeCount(result.likeCount)
      setLikedByMe(result.likedByMe)
    } catch {
      // silently fail — like is non-critical
    } finally {
      setLiking(false)
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

  const handleAddPhotoFile = async (file: File) => {
    if (!cat || !user) return
    setAddingPhoto(true)
    setError(null)
    setUploadProgress(10)
    try {
      const urls = await getUploadUrl(
        { filename: file.name, contentType: file.type, fileSizeBytes: file.size, catId: cat.id },
        user.credential,
      )
      setUploadProgress(30)

      // Generate thumb by resizing client-side using a canvas
      const thumb = await resizeImage(file, 400)
      setUploadProgress(40)

      await uploadToS3(urls.uploadUrl, file, file.type)
      setUploadProgress(70)
      await uploadToS3(urls.thumbUploadUrl, thumb, file.type)
      setUploadProgress(90)

      const updated = await addCatPhoto(cat.id, urls.imageKey, urls.thumbKey, user.credential)
      setUploadProgress(100)
      onUpdated(updated)
      setPhotoIndex(updated.photos.length - 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload photo')
    } finally {
      setAddingPhoto(false)
      setUploadProgress(0)
    }
  }

  const photos = cat?.photos ?? (cat ? [{ cdnUrl: cat.cdnUrl, thumbUrl: cat.thumbUrl, uploadedAt: cat.uploadedAt, userId: '', s3Key: '', thumbKey: '' }] : [])
  const currentPhoto = photos[photoIndex]
  const photoCount = photos.length

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
        <h2 className="font-bold text-lg truncate">
          {mode === 'view' && cat ? `🐱 ${cat.title}` : headerTitle}
        </h2>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {cat && mode === 'view' && (
            <button
              onClick={handleShare}
              className="p-1 rounded hover:bg-red-700 transition-colors relative"
              aria-label="Share"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={mode === 'edit' ? () => { setMode('view'); setError(null) } : onClose}
            className="p-1 rounded hover:bg-red-700 transition-colors"
            aria-label={mode === 'edit' ? 'Cancel edit' : 'Close'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
            {mode !== 'edit' && currentPhoto && (
              <div className="relative">
                <img src={currentPhoto.cdnUrl} alt={cat.title} className="w-full aspect-square object-cover" />

                {/* Photo navigation — only shown when there are multiple photos */}
                {photoCount > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                      disabled={photoIndex === 0}
                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-0 transition-opacity"
                      aria-label="Previous photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPhotoIndex((i) => Math.min(photoCount - 1, i + 1))}
                      disabled={photoIndex === photoCount - 1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-0 transition-opacity"
                      aria-label="Next photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {photoIndex + 1} / {photoCount}
                    </div>
                  </>
                )}
              </div>
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

                  {/* Like button */}
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={handleToggleLike}
                      disabled={!user || liking}
                      title={user ? (likedByMe ? 'Unlike' : 'Like') : 'Sign in to like'}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${liking ? 'scale-90' : user ? 'hover:scale-110' : ''}`}
                        fill={likedByMe ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{likeCount}</span>
                    </button>
                    {!user && (
                      <span className="text-xs text-gray-400">Sign in to like</span>
                    )}
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
          {/* Add photo upload progress */}
          {addingPhoto && (
            <div className="mb-3 space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Uploading photo… {uploadProgress}%</p>
            </div>
          )}

          {mode === 'view' && (
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={addingPhoto}
                className="w-full py-2 text-sm font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Photo
              </button>
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

          {/* Hidden file input for adding photos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleAddPhotoFile(file)
              e.target.value = ''
            }}
          />
        </div>
      )}
    </div>
  )
}

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        file.type,
        0.85,
      )
    }
    img.onerror = reject
    img.src = url
  })
}
