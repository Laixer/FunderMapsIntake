import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { INCIDENT_PREFIX, spaces } from '../utils/spaces'
import { throttle } from '../utils/throttle'

/**
 * Hand the browser one presigned PUT.
 *
 * Scoped to a single generated key, so a leaked URL can overwrite exactly one
 * object that nothing points at yet. The melder's filename never reaches the
 * key — it travels in the submission body instead, which keeps path traversal,
 * unicode surprises and duplicate names out of the bucket entirely.
 */
const ACCEPTED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/tiff',
  'application/octet-stream',
])

const EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/tiff': 'tif',
}

const MAX_BYTES = 25 * 1024 * 1024

export default defineEventHandler(async (event) => {
  throttle(event, 40, 60_000)

  const body = await readBody<{ name?: string; size?: number; type?: string }>(event)
  const size = Number(body?.size ?? 0)
  const type = String(body?.type ?? '')

  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Bestand is te groot of leeg' })
  }
  if (!ACCEPTED.has(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Bestandstype wordt niet ondersteund' })
  }

  // Phones hand over HEIC with no content type at all, so fall back to the
  // extension the melder's own filename carries rather than refusing a photo
  // that was just taken.
  const fallback = String(body?.name ?? '').split('.').pop()?.toLowerCase()
  const ext = EXTENSION[type] ?? (fallback && /^[a-z0-9]{2,5}$/.test(fallback) ? fallback : 'bin')

  const key = `${INCIDENT_PREFIX}${crypto.randomUUID()}.${ext}`

  const url = await getSignedUrl(
    spaces(),
    new PutObjectCommand({
      Bucket: useRuntimeConfig().s3Bucket,
      Key: key,
      ContentType: type,
      ContentLength: size,
    }),
    { expiresIn: 900 },
  )

  return { url, key }
})
