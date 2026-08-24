<script setup lang="ts">
/**
 * The last screen.
 *
 * The meldcode is the whole point of it: it is the melder's only handle on a
 * process that now runs without them. So it is the largest thing on the page,
 * selectable, and repeated in the email — not buried in a sentence of thanks.
 */
const props = defineProps<{ meldcode: string; email: string; address: string }>()

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(props.meldcode)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard is blocked often enough on mobile browsers that failing here
    // must not look broken — the code is on screen and selectable anyway.
  }
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <span aria-hidden="true" class="text-3xl text-green">✓</span>
      <h1 class="text-2xl font-bold text-ink">Uw melding is binnen</h1>
      <p class="text-muted">
        Wij hebben uw melding over <strong class="text-body">{{ address }}</strong> ontvangen.
      </p>
    </div>

    <div class="rounded-xl border border-line bg-surface p-5">
      <p class="text-sm font-semibold tracking-wide text-muted uppercase">Uw meldcode</p>
      <p class="mt-1 font-mono text-2xl font-bold break-all text-ink select-all">{{ meldcode }}</p>
      <button
        type="button"
        class="mt-3 min-h-11 font-semibold text-brand-ink underline-offset-2 hover:underline"
        @click="copy"
      >
        {{ copied ? 'Gekopieerd' : 'Kopieer meldcode' }}
      </button>
      <p class="mt-3 text-sm text-muted">
        Bewaar deze code. Met deze code kunt u later zien wat er met uw melding is gebeurd.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="font-bold text-ink">Wat gebeurt er nu?</h2>
      <p class="text-muted">
        Wij sturen een bevestiging naar
        <strong class="text-body">{{ email }}</strong>. Een van onze beoordelaars
        bekijkt uw melding en de documenten die u heeft meegestuurd. Als iets
        onduidelijk is, nemen wij contact met u op.
      </p>
    </div>

    <NuxtLink
      :to="`/melding/${meldcode}`"
      class="flex min-h-14 items-center justify-center rounded-xl border border-line-strong
             bg-surface px-4 font-semibold text-brand-ink"
    >
      Status van deze melding bekijken
    </NuxtLink>
  </section>
</template>
