import { Marker, Popup } from 'react-leaflet'
import type { CatListItem } from '../../types'
import { createCatIcon } from './markerIcons'

interface Props {
  cat: CatListItem
  onSelect: (id: string) => void
}

export function CatMarker({ cat, onSelect }: Props) {
  return (
    <Marker
      position={[cat.latitude, cat.longitude]}
      icon={createCatIcon(cat.thumbUrl)}
      eventHandlers={{ click: () => onSelect(cat.id) }}
    >
      <Popup>
        <div className="text-center min-w-[140px]">
          <img
            src={cat.thumbUrl}
            alt={cat.title}
            className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
          />
          <p className="font-semibold text-sm">{cat.title}</p>
          {cat.hdbBlock && (
            <p className="text-xs text-gray-500">
              Blk {cat.hdbBlock}
              {cat.town ? `, ${cat.town}` : ''}
            </p>
          )}
          <button
            onClick={() => onSelect(cat.id)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
          >
            View details →
          </button>
        </div>
      </Popup>
    </Marker>
  )
}
