import type { H3Event } from 'h3'
import { clientIp } from './throttle'

/**
 * Cloudflare Turnstile, the check that a person is filling in the form.
 *
 * The throttle stops one busy address; this stops a script that spreads itself
 * over many. The browser sends a fresh token with every upload grant and with
 * the submission (a token verifies once), and Cloudflare tells us whether it is
 * good. Off until NUXT_TURNSTILE_SECRET is set, so the form works the same
 * without it.
 */
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function requireHuman(event: H3Event) {
  const secret = useRuntimeConfig().turnstileSecret
  if (!secret) return

  const token = getRequestHeader(event, 'x-turnstile-token') ?? ''
  if (!token) {
    throw createError({ statusCode: 403, statusMessage: 'De controle ontbreekt. Vernieuw de pagina en probeer het opnieuw.' })
  }

  let outcome: { success?: boolean; 'error-codes'?: string[] }
  try {
    outcome = await $fetch(SITEVERIFY, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp(event) }),
      timeout: 10_000,
    })
  } catch (err: any) {
    // Cloudflare unreachable: refuse rather than wave everything through, but say
    // it is on our side so the melder tries again instead of giving up.
    console.error('turnstile siteverify failed', err?.message)
    throw createError({ statusCode: 503, statusMessage: 'De controle is even niet bereikbaar. Probeer het zo nog een keer.' })
  }

  if (!outcome.success) {
    console.warn('turnstile refused', (outcome['error-codes'] ?? []).join(','))
    throw createError({ statusCode: 403, statusMessage: 'De controle is niet gelukt. Probeer het opnieuw.' })
  }
}
