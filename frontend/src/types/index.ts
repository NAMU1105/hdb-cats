export interface Photo {
  s3Key: string
  thumbKey: string
  cdnUrl: string
  thumbUrl: string
  uploadedAt: string
  userId: string
}

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
  userId: string
  likeCount: number
  likedByMe?: boolean
  photos: Photo[]
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
  catId?: string  // pass to add a photo to an existing cat
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
