import { useCallback, useEffect, useRef, useState } from 'react'
import { searchOneMap, type OneMapResult } from '../../api/client'
import { HDB_TOWNS } from '../../utils/geo'

interface Props {
  title: string
  description: string
  hdbBlock: string
  town: string
  previewUrl: string | null
  location: [number, number] | null
  onField: (field: 'title' | 'description' | 'hdbBlock' | 'town', value: string) => void
  onLocationFromSearch: (lat: number, lng: number, block: string, town: string) => void
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function DetailsForm({
  title,
  description,
  hdbBlock,
  town,
  previewUrl,
  location,
  onField,
  onLocationFromSearch,
  onSubmit,
  onBack,
  submitting,
}: Props) {
  const [suggestions, setSuggestions] = useState<OneMapResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedBlock = useDebounce(hdbBlock, 400)
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedBlock.length < 2) { setSuggestions([]); return }
    searchOneMap(debouncedBlock).then((results) => {
      setSuggestions(results.slice(0, 5))
      setShowSuggestions(results.length > 0)
    }).catch(() => setSuggestions([]))
  }, [debouncedBlock])

  const pickSuggestion = useCallback(
    (r: OneMapResult) => {
      onField('hdbBlock', r.BLK_NO)
      const matchedTown = HDB_TOWNS.find((t) =>
        r.ADDRESS.toUpperCase().includes(t.toUpperCase()),
      )
      if (matchedTown) onField('town', matchedTown)
      onLocationFromSearch(parseFloat(r.LATITUDE), parseFloat(r.LONGITUDE), r.BLK_NO, matchedTown ?? '')
      setShowSuggestions(false)
    },
    [onField, onLocationFromSearch],
  )

  return (
    <div className="space-y-4">
      {/* Preview + location */}
      <div className="flex gap-3">
        {previewUrl && (
          <img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
        )}
        {location && (
          <div className="flex-1 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <div className="font-medium mb-1">📍 Location pinned</div>
            <div>{location[0].toFixed(5)}, {location[1].toFixed(5)}</div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => onField('title', e.target.value)}
          placeholder="e.g. Friendly tabby near the letterboxes"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          maxLength={100}
        />
      </div>

      {/* HDB Block with OneMap autocomplete */}
      <div className="relative" ref={blockRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">HDB Block</label>
        <input
          value={hdbBlock}
          onChange={(e) => { onField('hdbBlock', e.target.value); setShowSuggestions(true) }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="e.g. 412A"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-auto">
            {suggestions.map((r, i) => (
              <li
                key={i}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-red-50"
                onMouseDown={() => pickSuggestion(r)}
              >
                <div className="font-medium">{r.BLK_NO} {r.ROAD_NAME}</div>
                <div className="text-xs text-gray-400">{r.POSTAL}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Town */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
        <select
          value={town}
          onChange={(e) => onField('town', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
        >
          <option value="">Select town…</option>
          {HDB_TOWNS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => onField('description', e.target.value)}
          placeholder="Tell us about this cat…"
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          maxLength={500}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!title.trim() || submitting}
          className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Uploading…' : 'Share Cat 🐱'}
        </button>
      </div>
    </div>
  )
}
