export const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198]
export const SINGAPORE_ZOOM = 12
export const SINGAPORE_MIN_ZOOM = 11
export const SINGAPORE_MAX_ZOOM = 18

// Bounding box for Singapore
export const SINGAPORE_BOUNDS: [[number, number], [number, number]] = [
  [1.1, 103.5],
  [1.5, 104.1],
]

export function isWithinSingapore(lat: number, lng: number): boolean {
  return lat >= 1.1 && lat <= 1.5 && lng >= 103.5 && lng <= 104.1
}

// HDB towns in Singapore for the dropdown
export const HDB_TOWNS = [
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Boon Lay',
  'Bukit Batok',
  'Bukit Merah',
  'Bukit Panjang',
  'Bukit Timah',
  'Central Area',
  'Choa Chu Kang',
  'Clementi',
  'Geylang',
  'Hougang',
  'Jurong East',
  'Jurong West',
  'Kallang/Whampoa',
  'Marine Parade',
  'Pasir Ris',
  'Punggol',
  'Queenstown',
  'Sembawang',
  'Sengkang',
  'Serangoon',
  'Tampines',
  'Toa Payoh',
  'Woodlands',
  'Yishun',
]
