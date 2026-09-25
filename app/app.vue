<script setup lang="ts">
const partners = [
  { name: 'NRVT', src: '/partners/nrvt.svg' },
  { name: 'NWWI', src: '/partners/nwwi.svg' },
  { name: 'VastgoedNED', src: '/partners/vastgoedned.svg' },
  { name: 'NVM', src: '/partners/nvm.png' },
]
</script>

<template>
  <div class="min-h-dvh">
    <NuxtRouteAnnouncer />

    <header class="bg-navy">
      <div class="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4">
        <NuxtLink to="/" class="flex items-center" aria-label="FunderMaps, naar het begin van het formulier">
          <img src="/logo/fundermaps-logo-white.svg" alt="FunderMaps" class="h-7 w-auto">
        </NuxtLink>
        <span class="text-sm text-white/70">Funderingsinformatie doorgeven</span>
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
        <p class="text-xs font-semibold uppercase tracking-wide text-faint">Terugmeldingen voor uitgegeven funderingsrisico-indicaties aan</p>
        <ul class="flex flex-wrap items-center gap-x-8 gap-y-4">
          <li v-for="p in partners" :key="p.name">
            <img :src="p.src" :alt="p.name" class="h-7 w-auto opacity-60 grayscale" loading="lazy">
          </li>
        </ul>
      </div>
      <p>
        Nationale Database Funderingen ·
        <a class="underline underline-offset-2" href="https://fundermaps.com">fundermaps.com</a> ·
        <a class="underline underline-offset-2" href="https://fundermaps.com/privacy-statement.html">Privacy</a>
      </p>
    </footer>
  </div>
</template>
