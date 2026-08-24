/**
 * Address lookup against the PDOK Locatieserver.
 *
 * Public, no key, and the only thing standing between a melder and giving up.
 * Someone reporting a crack in their wall will type "kerkstr 12" on a phone,
 * one-handed, on 4G — so this debounces rather than fires per keystroke, and
 * abandons a request the moment a newer one starts. A suggestion list that
 * flickers backwards through stale results reads as broken.
 */
export interface Suggestion {
  id: string
  label: string
}

export interface ResolvedAddress {
  /** BAG nummeraanduiding — the identity everything downstream keys on. */
  bagId: string
  label: string
  lat?: number
  lng?: number
}

const SUGGEST = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest'
const LOOKUP = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup'

export function usePdok() {
  const suggestions = ref<Suggestion[]>([])
  const searching = ref(false)
  const failed = ref(false)
  let seq = 0

  async function suggest(term: string) {
    const q = term.trim()
    // Three characters is where results stop being noise.
    if (q.length < 3) {
      suggestions.value = []
      return
    }
    const mine = ++seq
    searching.value = true
    failed.value = false
    try {
      const url = `${SUGGEST}?q=${encodeURIComponent(q)}&fq=type:adres&rows=6`
      const res = await $fetch<{ response: { docs: { id: string; weergavenaam: string }[] } }>(url)
      if (mine !== seq) return // a newer keystroke already won
      suggestions.value = res.response.docs.map((d) => ({ id: d.id, label: d.weergavenaam }))
    } catch {
      if (mine === seq) {
        failed.value = true
        suggestions.value = []
      }
    } finally {
      if (mine === seq) searching.value = false
    }
  }

  /** Turn a chosen suggestion into a BAG id and a point. */
  async function resolve(s: Suggestion): Promise<ResolvedAddress | null> {
    try {
      const url = `${LOOKUP}?id=${encodeURIComponent(s.id)}&fl=id,weergavenaam,nummeraanduiding_id,centroide_ll`
      const res = await $fetch<{ response: { docs: Record<string, string>[] } }>(url)
      const doc = res.response.docs[0]
      if (!doc) return null

      // centroide_ll arrives as "POINT(5.12 52.09)" — lng first.
      const m = /POINT\(([\d.]+) ([\d.]+)\)/.exec(doc.centroide_ll ?? '')
      return {
        bagId: doc.nummeraanduiding_id ?? doc.id ?? s.id,
        label: doc.weergavenaam ?? s.label,
        lng: m ? Number(m[1]) : undefined,
        lat: m ? Number(m[2]) : undefined,
      }
    } catch {
      return null
    }
  }

  return { suggestions, searching, failed, suggest, resolve }
}
