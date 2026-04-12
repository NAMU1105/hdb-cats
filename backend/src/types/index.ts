export interface CatItem {
  PK: string
  SK: string
  id: string
  title: string
  description?: string
  hdbBlock?: string
  town?: string
  latitude: number
  longitude: number
  imageKey: string
  thumbKey: string
  cdnUrl: string
  thumbUrl: string
  uploadedAt: string
  status: 'active' | 'flagged' | 'deleted'
  userId: string
  likeCount?: number
}

export interface CatPublic {
  id: string
  title: string
  description?: string
  hdbBlock?: string
  town?: string
  latitude: number
  longitude: number
  imageKey: string
  cdnUrl: string
  thumbUrl: string
  uploadedAt: string
  status: 'active' | 'flagged' | 'deleted'
  likeCount: number
  likedByMe?: boolean
}

export interface CatListItem {
  id: string
  title: string
  latitude: number
  longitude: number
  thumbUrl: string
  hdbBlock?: string
  town?: string
  uploadedAt: string
}

// Singapore bounding box validation
export function isWithinSingapore(lat: number, lng: number): boolean {
  return lat >= 1.1 && lat <= 1.5 && lng >= 103.5 && lng <= 104.1
}
