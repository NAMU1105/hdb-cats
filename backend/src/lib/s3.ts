import { S3Client } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  // Disable automatic checksum calculation — SDK v3 adds x-amz-checksum-crc32
  // to presigned URLs by default, which browsers can't fulfil, causing 403s.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})
export const BUCKET = process.env.S3_BUCKET_NAME ?? 'hdb-cats-images'
export const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN ?? ''

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
const URL_TTL_SECONDS = 600 // 10 minutes

export function buildCdnUrl(key: string): string {
  return `${CDN_DOMAIN}/${key}`
}

export async function createPresignedPutUrl(
  key: string,
  contentType: string,
  fileSizeBytes: number,
): Promise<string> {
  if (fileSizeBytes > MAX_FILE_BYTES) {
    throw new Error(`File too large: max ${MAX_FILE_BYTES} bytes`)
  }
  // ContentLength is part of the signature — S3 will reject requests where the
  // actual Content-Length doesn't match, bounding uploads to exactly the declared size.
  // The frontend must send fetch({ body: file }) with the same file.size value it
  // passed to getUploadUrl; browsers always set Content-Length to the body size.
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  })
  return getSignedUrl(s3, command, { expiresIn: URL_TTL_SECONDS })
}
