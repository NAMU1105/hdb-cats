const MAX_ORIGINAL_PX = 1920
const MAX_THUMB_PX = 400
const ORIGINAL_QUALITY = 0.85
const THUMB_QUALITY = 0.7

function resizeCanvas(
  img: HTMLImageElement,
  maxPx: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = img
  if (width > maxPx || height > maxPx) {
    if (width > height) {
      height = Math.round((height * maxPx) / width)
      width = maxPx
    } else {
      width = Math.round((width * maxPx) / height)
      height = maxPx
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return { canvas, width, height }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/jpeg',
      quality,
    )
  })
}

export interface OptimizedImages {
  original: Blob
  thumb: Blob
  contentType: 'image/jpeg'
}

export async function optimizeImages(file: File): Promise<OptimizedImages> {
  const img = await loadImage(file)

  const { canvas: origCanvas, width: ow, height: oh } = resizeCanvas(img, MAX_ORIGINAL_PX)
  const origCtx = origCanvas.getContext('2d')!
  origCtx.drawImage(img, 0, 0, ow, oh)
  const original = await canvasToBlob(origCanvas, ORIGINAL_QUALITY)

  const { canvas: thumbCanvas, width: tw, height: th } = resizeCanvas(img, MAX_THUMB_PX)
  const thumbCtx = thumbCanvas.getContext('2d')!
  thumbCtx.drawImage(img, 0, 0, tw, th)
  const thumb = await canvasToBlob(thumbCanvas, THUMB_QUALITY)

  URL.revokeObjectURL(img.src)

  return { original, thumb, contentType: 'image/jpeg' }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
