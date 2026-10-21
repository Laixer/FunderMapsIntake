/**
 * One Cloudflare Turnstile token per request.
 *
 * The server checks a token on every upload grant and on the submission, and a
 * token is good for one check, so this hands out a fresh one each time. Most
 * people never see anything; when Cloudflare does want a click, the widget shows
 * pinned to the bottom of the screen, where it is in view whatever step the
 * melder is on. Without a site key (local, or before the keys exist) it hands
 * out an empty token and the server does not ask for one.
 */
interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string
  reset(id: string): void
  execute(id: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading: Promise<TurnstileApi> | null = null
let widget: { api: TurnstileApi; id: string } | null = null
let waiting: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null
// Uploads start in parallel; tokens are handed out one after the other.
let queue: Promise<unknown> = Promise.resolve()

function load(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')))
    script.onerror = () => {
      loading = null
      reject(new Error('turnstile script'))
    }
    document.head.appendChild(script)
  })
  return loading
}

async function ensureWidget(siteKey: string) {
  if (widget) return widget
  const api = await load()
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:50'
  document.body.appendChild(el)
  const id = api.render(el, {
    sitekey: siteKey,
    execution: 'execute',
    appearance: 'interaction-only',
    language: 'nl',
    callback: (token: string) => waiting?.resolve(token),
    'error-callback': () => waiting?.reject(new Error('turnstile error')),
    'expired-callback': () => waiting?.reject(new Error('turnstile expired')),
  })
  widget = { api, id }
  return widget
}

export function useTurnstile() {
  const siteKey = useRuntimeConfig().public.turnstileSiteKey as string

  /** A token for the next request; '' when Turnstile is not configured. */
  function token(): Promise<string> {
    if (!siteKey || import.meta.server) return Promise.resolve('')
    const next = queue.then(async () => {
      const w = await ensureWidget(siteKey)
      return new Promise<string>((resolve, reject) => {
        waiting = { resolve, reject }
        w.api.reset(w.id)
        w.api.execute(w.id)
      }).finally(() => (waiting = null))
    })
    queue = next.catch(() => undefined)
    return next
  }

  return { token }
}
