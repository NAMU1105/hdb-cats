import type { CatItem, CatPublic, Photo } from '../types/index'

export function normalizePhotos(item: CatItem): Photo[] {
  if (item.photos && item.photos.length > 0) return item.photos
  // Legacy items: single photo stored as flat fields
  return [
    {
      s3Key: item.imageKey,
      thumbKey: item.thumbKey,
      cdnUrl: item.cdnUrl,
      thumbUrl: item.thumbUrl,
      uploadedAt: item.uploadedAt,
      userId: item.userId,
    },
  ]
}

export function toCatPublic(item: CatItem, likeCount?: number, likedByMe?: boolean): CatPublic {
  const photos = normalizePhotos(item)
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    hdbBlock: item.hdbBlock,
    town: item.town,
    latitude: item.latitude,
    longitude: item.longitude,
    imageKey: item.imageKey,
    cdnUrl: photos[0].cdnUrl,
    thumbUrl: photos[0].thumbUrl,
    uploadedAt: item.uploadedAt,
    status: item.status,
    userId: item.userId,
    likeCount: likeCount ?? item.likeCount ?? 0,
    likedByMe,
    photos,
  }
}
