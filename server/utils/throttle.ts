import type { H3Event } from 'h3'

/**
 * A crude per-IP window.
 *
 * In-memory, so it does not survive a restart and does not span instances. That
 * is deliberate: this is a speed bump against a bored script, not a security
 * control, and the real limit is that every object lands under a key only our
 * server hands out.
 */
const hits = new Map<string, number[]>()

export function clientIp(event: H3Event): string {
  // On DigitalOcean's edge, x-forwarded-for is multi-hop and spoofable;
  // do-connecting-ip is the only header that means anything. Falling back to
  // the socket rather than a shared "unknown" bucket matters: one shared key
  // would let a single script throttle every other melder at once.
  return (
    getRequestHeader(event, 'do-connecting-ip') ??
    getRequestHeader(event, 'x-real-ip') ??
    event.node.req.socket.remoteAddress ??
    'unknown'
  )
}

export function throttle(event: H3Event, limit: number, windowMs: number) {
  const ip = clientIp(event)
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(ip, recent)

  // Opportunistic sweep so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  }

  if (recent.length > limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Te veel verzoeken. Probeer het over een minuut nog eens.',
    })
  }
}
