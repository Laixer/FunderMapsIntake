<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

// A mistyped or outdated address is how a visitor ends up here; say that in
// plain words. Anything else is ours, and its details are not for the page.
const notFound = computed(() => props.error?.statusCode === 404)

useHead({
  title: () => (notFound.value ? 'Pagina niet gevonden — FunderMaps' : 'Er ging iets mis — FunderMaps'),
})
</script>

<template>
  <div class="min-h-dvh">
    <!-- The same bar as app.vue. Plain links, not NuxtLink: a full page load
         is what clears the error. -->
    <header class="bg-navy">
      <div class="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4">
        <a href="/" class="flex items-center" aria-label="FunderMaps, naar het begin van het formulier">
          <img src="/logo/fundermaps-logo-white.svg" alt="FunderMaps" width="222" height="41" class="h-7 w-auto">
        </a>
        <span class="text-sm text-white/70">Funderingsinformatie doorgeven</span>
      </div>
    </header>

    <main class="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 class="text-2xl font-bold text-ink">
        {{ notFound ? 'Deze pagina bestaat niet' : 'Er ging iets mis' }}
      </h1>
      <p v-if="notFound" class="text-body">
        Het adres van deze pagina klopt niet, of de pagina bestaat niet meer. Controleer de link, of begin bij het
        formulier.
      </p>
      <p v-else class="text-body">
        De pagina kon niet worden geladen. Probeer het over een paar minuten opnieuw.
      </p>
      <p>
        <a href="/" class="text-brand-ink underline-offset-2 hover:underline">Naar het formulier</a>
      </p>
    </main>
  </div>
</template>
