<script setup lang="ts">
import type { ResolvedAddress } from '~/composables/usePdok'

/**
 * The prefilled deep link — the whole reason this app renders on the server.
 *
 * A partner, or our own map, sends someone straight here with a building
 * already named. Resolving that on the server means the melder's first paint
 * already says which house this is about, instead of a spinner over a form they
 * have to fill in from scratch on 4G.
 *
 * Two identifiers arrive here in practice: a 16-digit BAG nummeraanduiding
 * (which PDOK resolves without a key) and `NL.IMBAG.PAND.…` from our own map
 * (which only our geocoder knows about).
 */
const route = useRoute()
const id = String(route.params.bag ?? '')

const { data: prefill } = await useAsyncData<ResolvedAddress | null>(
  `prefill:${id}`,
  () => resolveIdentifier(id),
  { default: () => null },
)

useHead({
  title: prefill.value
    ? `${prefill.value.label} — funderingsinformatie doorgeven`
    : 'Funderingsinformatie doorgeven — FunderMaps',
  // A deep link is handed out, pasted and forwarded; it should not accumulate
  // in search results under a stranger's address.
  meta: [{ name: 'robots', content: 'noindex' }],
})

async function resolveIdentifier(input: string): Promise<ResolvedAddress | null> {
  if (/^\d{16}$/.test(input)) return await fromPdok(input)
  if (/^NL\.IMBAG\.PAND\.\d+$/i.test(input)) return await fromGeocoder(input)
  return null
}

async function fromPdok(bagId: string): Promise<ResolvedAddress | null> {
  try {
    const res = await $fetch<{ response: { docs: Record<string, string>[] } }>(
      'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free',
      { query: { q: `nummeraanduiding_id:${bagId}`, fq: 'type:adres', fl: 'weergavenaam,nummeraanduiding_id,centroide_ll', rows: 1 } },
    )
    const doc = res.response.docs[0]
    if (!doc) return null
    const m = /POINT\(([\d.]+) ([\d.]+)\)/.exec(doc.centroide_ll ?? '')
    return {
      bagId: doc.nummeraanduiding_id ?? bagId,
      label: doc.weergavenaam ?? bagId,
      lng: m ? Number(m[1]) : undefined,
      lat: m ? Number(m[2]) : undefined,
    }
  } catch {
    return null
  }
}

async function fromGeocoder(pandId: string): Promise<ResolvedAddress | null> {
  const base = useRuntimeConfig().public.apiBase
  if (!base) return null
  try {
    const b = await $fetch<Record<string, any>>(`/api/geocoder/building-info/${encodeURIComponent(pandId)}`, { baseURL: base })
    // A pand with no address row is a real case — sheds, transformer huts, and
    // buildings mid-BAG-update all come back this way. There is nothing to
    // prefill, so fall through to the blank form rather than guessing.
    if (!b?.address_external_id) return null
    return {
      // Normalised to the bare 16 digits, so a submission carries one identity
      // format whether it came from PDOK or from our own map.
      bagId: String(b.address_external_id).replace(/^NL\.IMBAG\.NUMMERAANDUIDING\./i, ''),
      label: [
        [b.street, b.building_number].filter(Boolean).join(' '),
        [b.postal_code, b.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', '),
      lat: b.residence_lat ?? b.building_lat ?? undefined,
      lng: b.residence_lon ?? b.building_lon ?? undefined,
    }
  } catch {
    return null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- The link was wrong or the building is gone. Say so, then get out of the
         way — the form below still works from a blank address field. -->
    <p v-if="!prefill" class="rounded-xl border border-amber bg-amber-tint px-4 py-3 text-ink">
      Wij konden dit pand niet terugvinden. Zoek het adres hieronder op.
    </p>
    <IntakeForm :prefill="prefill" />
  </div>
</template>
