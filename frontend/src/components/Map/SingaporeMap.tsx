import 'leaflet/dist/leaflet.css'
import './markerIcons' // apply icon fix

import { MapContainer, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { CatListItem } from '../../types'
import {
  SINGAPORE_BOUNDS,
  SINGAPORE_CENTER,
  SINGAPORE_MAX_ZOOM,
  SINGAPORE_MIN_ZOOM,
  SINGAPORE_ZOOM,
} from '../../utils/geo'
import { CatMarker } from './CatMarker'
import { LocationPicker } from './LocationPicker'

interface Props {
  cats: CatListItem[]
  onCatSelect: (id: string) => void
  pickingLocation: boolean
  pickedLocation: [number, number] | null
  onLocationPick: (lat: number, lng: number) => void
  onMapClick?: (lat: number, lng: number) => void
}

export function SingaporeMap({
  cats,
  onCatSelect,
  pickingLocation,
  pickedLocation,
  onLocationPick,
  onMapClick,
}: Props) {
  return (
    <MapContainer
      center={SINGAPORE_CENTER}
      zoom={SINGAPORE_ZOOM}
      minZoom={SINGAPORE_MIN_ZOOM}
      maxZoom={SINGAPORE_MAX_ZOOM}
      maxBounds={SINGAPORE_BOUNDS}
      maxBoundsViscosity={0.8}
      className="w-full h-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
      >
        {cats.map((cat) => (
          <CatMarker key={cat.id} cat={cat} onSelect={onCatSelect} />
        ))}
      </MarkerClusterGroup>

      <LocationPicker
        location={pickedLocation}
        onLocationPick={onLocationPick}
        active={pickingLocation}
        onMapClick={onMapClick}
      />
    </MapContainer>
  )
}
