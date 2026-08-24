import { throttle } from '../utils/throttle'

/**
 * Look up one melding, by code plus the email that made it.
 *
 * Meldcodes are sequential — `FIR012026-7263` is one away from someone else's —
 * so the code by itself proves nothing. Every failure returns the same 404
 * regardless of which half was wrong, because a distinguishable "wrong email"
 * would turn this into a way to enumerate which codes exist.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default defineEventHandler(async (event) => {
  throttle(event, 20, 60_000)

  const body = await readBody<{ meldcode?: string; email?: string }>(event)
  const meldcode = String(body?.meldcode ?? '').trim()
  const email = String(body?.email ?? '').trim()
  const config = useRuntimeConfig()

  const notFound = () => createError({ statusCode: 404, statusMessage: 'Niet gevonden' })

  if (!/^FIR\d{6}-\d+$/.test(meldcode) || !EMAIL.test(email)) throw notFound()
  if (!config.apiBase || !config.intakeToken) throw notFound()

  try {
    return await $fetch('/api/intake/status', {
      baseURL: config.apiBase,
      method: 'POST',
      headers: { authorization: `Bearer ${config.intakeToken}` },
      body: { meldcode, email },
    })
  } catch {
    throw notFound()
  }
})
