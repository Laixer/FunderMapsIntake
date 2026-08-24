/**
 * Liveness for the App Platform health check.
 *
 * Deliberately touches nothing — no Spaces call, no API call. A health check
 * that depends on a downstream service turns someone else's outage into a
 * restart loop here, and a form that cannot reach the API can still render,
 * still take an address, and still say something useful to the melder.
 */
export default defineEventHandler(() => ({ status: 'ok' }))
