<template>
  <div class="min-h-dvh">
    <NuxtRouteAnnouncer />

    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
        <NuxtLink to="/" class="font-bold tracking-tight text-ink">FunderMaps</NuxtLink>
        <span class="text-muted">Funderingsinformatie doorgeven</span>
      </div>
    </header>

    <!-- max-w-2xl, not wider: this is a form, and a 40rem measure keeps the
         labels reading as a single column on a tablet as well as a phone. -->
    <main class="mx-auto max-w-2xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <NuxtPage />
    </main>

    <footer class="mx-auto max-w-2xl px-4 pb-10 text-sm text-muted">
      <p>Nationale Funderingsdatabase · FunderMaps</p>
    </footer>
  </div>
</template>
