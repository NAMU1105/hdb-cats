import { useEffect } from 'react'
import { Marker, useMapEvents } from 'react-leaflet'
import { createPinIcon } from './markerIcons'

interface Props {
  location: [number, number] | null
  onLocationPick: (lat: number, lng: number) => void
  active: boolean
  onMapClick?: (lat: number, lng: number) => void
}

export function LocationPicker({ location, onLocationPick, active, onMapClick }: Props) {
  const map = useMapEvents({
    click(e) {
      if (active) {
        onLocationPick(e.latlng.lat, e.latlng.lng)
      } else if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  useEffect(() => {
    if (active) {
      map.getContainer().style.cursor = 'crosshair'
    } else if (onMapClick) {
      map.getContainer().style.cursor = 'pointer'
    } else {
      map.getContainer().style.cursor = ''
    }
    return () => {
      map.getContainer().style.cursor = ''
    }
  }, [active, onMapClick, map])

  if (!location) return null

  return <Marker position={location} icon={createPinIcon()} />
}
