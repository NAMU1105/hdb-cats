import type {
  Cat,
  CatListItem,
  CreateCatRequest,
  GetCatsResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function fetchCats(town?: string): Promise<CatListItem[]> {
  const params = town ? `?town=${encodeURIComponent(town)}` : ''
  const data = await request<GetCatsResponse>(`/cats${params}`)
  return data.items
}

export async function fetchCat(id: string): Promise<Cat> {
  return request<Cat>(`/cats/${id}`)
}

export async function getUploadUrl(payload: UploadUrlRequest, token: string): Promise<UploadUrlResponse> {
  return request<UploadUrlResponse>('/upload-url', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createCat(payload: CreateCatRequest, token: string): Promise<Cat> {
  return request<Cat>('/cats', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteCat(id: string): Promise<void> {
  await request<void>(`/cats/${id}`, { method: 'DELETE' })
}

export async function uploadToS3(url: string, file: Blob, contentType: string): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
}

export async function searchOneMap(query: string): Promise<OneMapResult[]> {
  const res = await fetch(
    `/api/onemap/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.results || []) as OneMapResult[]
}

export interface OneMapResult {
  SEARCHVAL: string
  BLK_NO: string
  ROAD_NAME: string
  BUILDING: string
  ADDRESS: string
  POSTAL: string
  X: string
  Y: string
  LATITUDE: string
  LONGITUDE: string
}
