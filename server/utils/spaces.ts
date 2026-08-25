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
 * Public submissions land under `intake/`, flat, keyed by uuid.
 *
 * Its own prefix, deliberately. Three others already exist and none of them is
 * this:
 *
 * - `incident-report/` is the old loket's attachments. A funderingsonderzoek
 *   from a bureau is not an incident, and filing it there would repeat at the
 *   storage layer the mistake the intake route made in the database.
 * - `dataops/` is the pipeline's scratch space — documents it fetched to read.
 *   What a member of the public hands us is not scratch; it may be the only
 *   copy of a 1912 drawing in existence.
 * - `inquiry-report/` is evidence behind a committed inquiry, the thing the
 *   whole database rests on. A submission has not earned that until a reviewer
 *   accepts it.
 *
 * So: `intake/` is what arrived, unjudged. Nothing here may write anywhere else.
 */
export const INTAKE_PREFIX = 'intake/'
