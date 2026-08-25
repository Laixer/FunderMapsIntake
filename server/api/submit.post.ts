import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { INTAKE_PREFIX, spaces } from '../utils/spaces'
import { clientIp, throttle } from '../utils/throttle'

/**
 * Take the submission and hand it to FunderMaps.
 *
 * The browser tells us which object keys to attach, so both halves of that
 * claim get checked here: the key must sit under `intake/`, and the
 * object must actually exist. Without the prefix check a crafted submission
 * could attach `inquiry-report/...` — someone else's evidence — to a public
 * incident and read it back out through the melding portal.
 */
interface Attachment {
  key?: string
  name?: string
  size?: number
  category?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default defineEventHandler(async (event) => {
  throttle(event, 10, 60_000)

  const body = await readBody<Record<string, any>>(event)
  const config = useRuntimeConfig()

  // Two identity formats reach us: PDOK hands back a bare 16-digit
  // nummeraanduiding, our own geocoder hands back the NL.IMBAG.* form. Both are
  // accepted upstream, so neither is rewritten here.
  const bagId = String(body?.address?.bagId ?? '').trim()
  const BAG_ID = /^(\d{16}|NL\.IMBAG\.(NUMMERAANDUIDING|PAND|VERBLIJFSOBJECT|LIGPLAATS|STANDPLAATS)\.\d+)$/i
  if (!BAG_ID.test(bagId)) {
    throw createError({ statusCode: 400, statusMessage: 'Geen geldig adres gekozen' })
  }
  if (!body?.topic) {
    throw createError({ statusCode: 400, statusMessage: 'Geen onderwerp gekozen' })
  }
  if (!EMAIL.test(String(body?.contact?.email ?? '').trim())) {
    throw createError({ statusCode: 400, statusMessage: 'Geen geldig e-mailadres' })
  }

  const claimed: Attachment[] = Array.isArray(body.attachments) ? body.attachments.slice(0, 10) : []
  const attachments = []
  for (const a of claimed) {
    const key = String(a?.key ?? '')
    if (!key.startsWith(INTAKE_PREFIX) || key.includes('..')) {
      throw createError({ statusCode: 400, statusMessage: 'Ongeldige bijlage' })
    }
    try {
      await spaces().send(new HeadObjectCommand({ Bucket: config.s3Bucket, Key: key }))
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Een bijlage is niet aangekomen' })
    }
    attachments.push({
      key,
      // The melder's filename is kept for a human to read, never for a path.
      name: String(a?.name ?? '').slice(0, 255),
      size: Number(a?.size ?? 0),
      category: String(a?.category ?? 'overig'),
    })
  }

  if (!config.apiBase || !config.intakeToken) {
    throw createError({ statusCode: 503, statusMessage: 'Meldingen worden nu niet aangenomen' })
  }

  const payload = {
    building: bagId,
    topic: String(body.topic),
    // The Dutch label as the melder read it. Kept because the wording of these
    // topics has changed before and will again — `noDamage` still carries a
    // name from when it meant something else — and a reviewer months later
    // should see the question that was actually put to the person.
    topicLabel: String(body.topicLabel ?? '').slice(0, 200),
    answers: body.answers ?? {},
    attachments,
    contact: {
      type: body.contact?.type ?? null,
      name: String(body.contact?.name ?? '').slice(0, 200),
      email: String(body.contact.email).trim().slice(0, 320),
      phone: String(body.contact?.phone ?? '').slice(0, 40) || null,
      company: String(body.contact?.company ?? '').slice(0, 200) || null,
    },
    owner: body.owner === true,
    note: String(body.note ?? '').slice(0, 5000) || null,
    formVersion: String(body.formVersion ?? '').slice(0, 64),
    // Provenance the reviewer sees next to the answers. Recorded because a
    // submission is read months later by someone deciding whether to trust it.
    source: {
      submission: String(body.submissionId ?? ''),
      address: String(body.address?.label ?? ''),
      ip: clientIp(event),
      agent: getRequestHeader(event, 'user-agent')?.slice(0, 300) ?? null,
      referrer: getRequestHeader(event, 'referer')?.slice(0, 300) ?? null,
    },
  }

  try {
    // A submission becomes a dossier, not an incident. Four of the six topics
    // deliver a document; whether any of it is a melding is a reviewer's call
    // at commit time, not the front door's.
    const result = await $fetch<{ reference: string }>('/api/intake/dossier', {
      baseURL: config.apiBase,
      method: 'POST',
      headers: { authorization: `Bearer ${config.intakeToken}` },
      body: payload,
    })
    // "Meldcode" is the word the melder reads; `reference` is what the wire
    // and the database call it. The mapping lives here and nowhere else.
    return { meldcode: result.reference }
  } catch (err: any) {
    // Never surface the upstream body: it can carry internal detail, and the
    // melder can do nothing with it either way.
    console.error('intake submit failed', err?.status ?? '', err?.statusText ?? err?.message)
    throw createError({ statusCode: 502, statusMessage: 'Melding kon niet worden opgeslagen' })
  }
})
