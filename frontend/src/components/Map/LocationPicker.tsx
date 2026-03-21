import { useEffect } from 'react'
import { Marker, useMapEvents } from 'react-leaflet'
import { createPinIcon } from './markerIcons'

interface Props {
  location: [number, number] | null
  onLocationPick: (lat: number, lng: number) => void
  active: boolean
}

export function LocationPicker({ location, onLocationPick, active }: Props) {
  const map = useMapEvents({
    click(e) {
      if (active) {
        onLocationPick(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  useEffect(() => {
    if (active) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
    return () => {
      map.getContainer().style.cursor = ''
    }
  }, [active, map])

  if (!location) return null

  return <Marker position={location} icon={createPinIcon()} />
}
