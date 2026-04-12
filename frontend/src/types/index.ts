export interface Cat {
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

export interface GetCatsResponse {
  items: CatListItem[]
  nextCursor: string | null
}

export interface UploadUrlRequest {
  filename: string
  contentType: string
  fileSizeBytes: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  thumbUploadUrl: string
  imageKey: string
  thumbKey: string
  catId: string
}

export interface CreateCatRequest {
  catId: string
  imageKey: string
  thumbKey: string
  title: string
  description?: string
  hdbBlock?: string
  town?: string
  latitude: number
  longitude: number
}

export type UploadStep =
  | 'idle'
  | 'picking-image'
  | 'picking-location'
  | 'filling-details'
  | 'uploading'
  | 'success'
  | 'error'
