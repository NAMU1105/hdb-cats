import { useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Cat, UploadStep } from '../../types'
import { SINGAPORE_BOUNDS, SINGAPORE_CENTER, SINGAPORE_ZOOM } from '../../utils/geo'
import { LocationPicker } from '../Map/LocationPicker'
import { ImageDropzone } from './ImageDropzone'
import { DetailsForm } from './DetailsForm'

interface Props {
  step: UploadStep
  file: File | null
  previewUrl: string | null
  location: [number, number] | null
  title: string
  description: string
  hdbBlock: string
  town: string
  error: string | null
  progress: number
  onClose: () => void
  onFile: (file: File) => void
  onLocationPick: (lat: number, lng: number) => void
  onField: (field: 'title' | 'description' | 'hdbBlock' | 'town', value: string) => void
  onSubmit: () => void
  onBack: () => void
  onLocationFromSearch: (lat: number, lng: number, block: string, town: string) => void
  onSuccess: (cat: Cat) => void
}

const STEP_LABELS: Record<UploadStep, string> = {
  idle: '',
  'picking-image': 'Step 1 – Choose a photo',
  'picking-location': 'Step 2 – Pin the location',
  'filling-details': 'Step 3 – Add details',
  uploading: 'Uploading…',
  success: '🎉 Cat shared!',
  error: 'Something went wrong',
}

export function UploadModal({
  step,
  previewUrl,
  location,
  title,
  description,
  hdbBlock,
  town,
  error,
  progress,
  onClose,
  onFile,
  onLocationPick,
  onField,
  onSubmit,
  onBack,
  onLocationFromSearch,
}: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (step === 'idle') return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-900">{STEP_LABELS[step]}</h2>
            {(['picking-image', 'picking-location', 'filling-details'] as UploadStep[]).includes(step) && (
              <div className="flex gap-1 mt-1">
                {(['picking-image', 'picking-location', 'filling-details'] as UploadStep[]).map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full flex-1 transition-colors ${
                      i <= (['picking-image', 'picking-location', 'filling-details'] as UploadStep[]).indexOf(step)
                        ? 'bg-red-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'picking-image' && <ImageDropzone onFile={onFile} />}

          {step === 'picking-location' && (
            <div className="space-y-3">
              {previewUrl && (
                <img src={previewUrl} alt="preview" className="w-full h-32 object-cover rounded-lg" />
              )}
              <p className="text-sm text-gray-600 font-medium">
                Click on the map to pin where you spotted the cat:
              </p>
              <div className="h-72 rounded-xl overflow-hidden border">
                <MapContainer
                  center={location ?? SINGAPORE_CENTER}
                  zoom={SINGAPORE_ZOOM}
                  maxBounds={SINGAPORE_BOUNDS}
                  maxBoundsViscosity={0.8}
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationPicker
                    location={location}
                    onLocationPick={onLocationPick}
                    active={true}
                  />
                </MapContainer>
              </div>
              {location && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Location pinned! Click "Next" to continue.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => location && onField('title', title)} // trigger step transition via submit in parent
                  disabled={!location}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  // We use onLocationPick to auto-advance step in useUpload
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 'filling-details' && (
            <DetailsForm
              title={title}
              description={description}
              hdbBlock={hdbBlock}
              town={town}
              previewUrl={previewUrl}
              location={location}
              onField={onField}
              onLocationFromSearch={onLocationFromSearch}
              onSubmit={onSubmit}
              onBack={onBack}
              submitting={false}
            />
          )}

          {step === 'uploading' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-5xl animate-bounce">🐱</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-600 text-sm">Sharing your cat with Singapore… {progress}%</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-bold text-gray-900">Cat shared!</h3>
              <p className="text-gray-500 text-sm">
                Your HDB cat is now on the map for everyone to see.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Back to map
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-5xl">😿</div>
              <p className="text-red-600 font-medium">{error ?? 'Something went wrong'}</p>
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={onSubmit}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
