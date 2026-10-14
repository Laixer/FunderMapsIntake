<script setup lang="ts">
// One height per logo: the portrait file has white space around its mark, so
// at the height of the wide ones it shrinks to a speck. `size` is the file's
// own, so its space is kept while it loads and the row does not slide.
const partners = [
  { name: 'NRVT', src: '/partners/nrvt.svg', height: 'h-7', size: [168, 77] },
  { name: 'NWWI', src: '/partners/nwwi.svg', height: 'h-7', size: [699, 279] },
  { name: 'VastgoedNED', src: '/partners/vastgoedned.svg', height: 'h-7', size: [358, 166] },
  { name: 'NVM', src: '/partners/nvm.png', height: 'h-10', size: [200, 253] },
]

// The form has no heading of its own, so on its two routes the header's line
// is the page's h1. The melding page and the receipt bring their own.
const route = useRoute()
const receiptShown = useState('receipt-shown', () => false)
const lineIsHeading = computed(
  () => (route.name === 'index' || route.name === 'form-bag') && !receiptShown.value,
)
</script>

<template>
  <div class="min-h-dvh">
    <NuxtRouteAnnouncer />

    <header class="bg-navy">
      <div class="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4">
        <NuxtLink to="/" class="flex items-center" aria-label="FunderMaps, naar het begin van het formulier">
          <img src="/logo/fundermaps-logo-white.svg" alt="FunderMaps" width="222" height="41" class="h-7 w-auto">
        </NuxtLink>
        <component :is="lineIsHeading ? 'h1' : 'span'" class="text-sm text-white/70">Funderingsinformatie doorgeven</component>
      </div>
    </header>

    <!-- max-w-2xl, not wider: this is a form, and a 40rem measure keeps the
         labels reading as a single column on a tablet as well as a phone. -->
    <main class="mx-auto max-w-2xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <NuxtPage />
    </main>

    <footer class="mx-auto max-w-2xl space-y-5 border-t border-line px-4 pt-6 pb-10 text-sm text-muted">
      <!-- The parties whose members report through this form (Don, 2026-09-25):
           present but quiet, greyed out. -->
      <div class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Terugmeldingen voor uitgegeven funderingsrisico-indicaties aan</p>
        <ul class="flex flex-wrap items-center gap-x-8 gap-y-4">
          <li v-for="p in partners" :key="p.name">
            <img
              :src="p.src" :alt="p.name" :width="p.size[0]" :height="p.size[1]"
              class="w-auto opacity-60 grayscale" :class="p.height" loading="lazy"
            >
          </li>
        </ul>
      </div>
      <!-- On a phone the name gets a line of its own, so no "·" hangs at either end of a line. -->
      <p>
        <span class="block sm:inline">Nationale Database Funderingen<span class="hidden sm:inline"> · </span></span>
        <a class="underline underline-offset-2" href="https://fundermaps.com">fundermaps.com</a> ·
        <a class="underline underline-offset-2" href="https://fundermaps.com/privacy-statement.html">Privacy</a>
      </p>
    </footer>
  </div>
</template>
