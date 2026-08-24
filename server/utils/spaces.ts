import { S3Client } from '@aws-sdk/client-s3'

/**
 * DO Spaces, path-style, same as the Worker and the API.
 *
 * The intake app is the only place in this repo that holds a credential, and it
 * never leaves the server: the browser gets a presigned PUT for one key and
 * nothing else.
 */
let client: S3Client | null = null

export function spaces(): S3Client {
  if (client) return client
  const c = useRuntimeConfig()
  if (!c.s3AccessKey || !c.s3SecretKey) {
    throw createError({ statusCode: 500, statusMessage: 'Object storage is not configured' })
  }
  client = new S3Client({
    endpoint: c.s3Endpoint,
    region: c.s3Region,
    credentials: { accessKeyId: c.s3AccessKey, secretAccessKey: c.s3SecretKey },
    forcePathStyle: true,
  })
  return client
}

/**
 * Attachments land under `incident-report/`, flat, keyed by uuid — the same
 * layout the portal has used since 2020.
 *
 * `dataops/` and `inquiry-report/` are separate worlds and nothing here may
 * ever write into them: one holds a scratch pipeline, the other holds the
 * evidence the whole database rests on.
 */
export const INCIDENT_PREFIX = 'incident-report/'
