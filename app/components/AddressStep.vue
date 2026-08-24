<script setup lang="ts">
import type { ResolvedAddress, Suggestion } from '~/composables/usePdok'

/**
 * Step 1 — which building.
 *
 * The whole submission hangs on getting this right, and it is the step where
 * people give up. So: one field, big touch targets, results as you type, and a
 * clear confirmation of what was chosen before anything else appears.
 */
const model = defineModel<ResolvedAddress | null>()

const { suggestions, searching, failed, suggest, resolve } = usePdok()
const term = ref('')
const busy = ref(false)
const open = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
watch(term, (v) => {
  // 220ms: long enough to skip most keystrokes, short enough that the list
  // feels like it is keeping up.
  clearTimeout(timer)
  open.value = true
  timer = setTimeout(() => suggest(v), 220)
})

async function pick(s: Suggestion) {
  busy.value = true
  open.value = false
  const resolved = await resolve(s)
  busy.value = false
  if (!resolved) return
  model.value = resolved
  term.value = resolved.label
}

function clear() {
  model.value = null
  term.value = ''
  suggestions.value = []
  open.value = false
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div>
      <h2 class="text-xl font-bold text-ink">Om welk pand gaat het?</h2>
      <p class="mt-1 text-muted">Typ het adres — straat, huisnummer en plaats.</p>
    </div>

    <!-- Chosen: a plain confirmation, and an obvious way to change it. -->
    <div
      v-if="model"
      class="flex items-center gap-3 rounded-xl border border-green bg-green-tint px-4 py-3"
    >
      <span aria-hidden="true" class="text-green">✓</span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold text-ink">{{ model.label }}</span>
        <span class="block font-mono text-sm text-muted">BAG {{ model.bagId }}</span>
      </span>
      <button
        type="button"
        class="min-h-11 shrink-0 px-3 font-semibold text-brand-ink underline-offset-2 hover:underline"
        @click="clear"
      >
        Wijzigen
      </button>
    </div>

    <!-- Searching -->
    <div v-else class="relative">
      <input
        v-model="term"
        type="search"
        inputmode="search"
        autocomplete="street-address"
        enterkeyhint="search"
        placeholder="Bijv. Kerkstraat 12, Utrecht"
        aria-label="Adres zoeken"
        class="min-h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base
               placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand-tint
               focus:outline-none"
        @focus="open = true"
      />

      <p v-if="busy" class="mt-2 text-sm text-muted">Adres ophalen…</p>
      <p v-else-if="searching" class="mt-2 text-sm text-muted">Zoeken…</p>
      <p v-else-if="failed" class="mt-2 text-sm text-red">
        Het adressenregister is even niet bereikbaar. Probeer het zo nog eens.
      </p>

      <ul
        v-if="open && suggestions.length"
        class="mt-2 overflow-hidden rounded-xl border border-line bg-surface"
      >
        <li v-for="s in suggestions" :key="s.id">
          <button
            type="button"
            class="min-h-13 w-full border-b border-line px-4 py-3 text-left last:border-b-0
                   hover:bg-canvas active:bg-canvas"
            @click="pick(s)"
          >
            {{ s.label }}
          </button>
        </li>
      </ul>

      <p v-else-if="open && term.length >= 3 && !searching && !failed" class="mt-2 text-sm text-muted">
        Geen adres gevonden. Probeer straat en huisnummer, bijvoorbeeld “Kerkstraat 12”.
      </p>
    </div>
  </section>
</template>
