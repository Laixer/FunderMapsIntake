<script setup lang="ts">
/**
 * The melding portal.
 *
 * A meldcode alone is not a credential — the codes are sequential, so anyone
 * could count from FM2026-000001 upward. The email address that made the
 * submission has to match before anything is shown, and the wrong-answer
 * response is deliberately identical to the not-found one so the page cannot
 * be used to test whether a code exists.
 */
const route = useRoute()
const code = String(route.params.code ?? '')

useHead({ title: `Melding ${code} — FunderMaps`, meta: [{ name: 'robots', content: 'noindex' }] })

interface Status {
  meldcode: string
  address: string
  received: string
  state: 'ontvangen' | 'in behandeling' | 'verwerkt' | 'afgewezen'
  explanation: string
  attachments: number
}

const email = ref('')
const looking = ref(false)
const status = ref<Status | null>(null)
const missed = ref(false)

async function look() {
  if (!email.value.trim() || looking.value) return
  looking.value = true
  missed.value = false
  try {
    status.value = await $fetch<Status>('/api/status', {
      method: 'POST',
      body: { meldcode: code, email: email.value.trim() },
    })
  } catch {
    missed.value = true
    status.value = null
  } finally {
    looking.value = false
  }
}

const tone: Record<Status['state'], string> = {
  ontvangen: 'border-line bg-surface',
  'in behandeling': 'border-brand bg-brand-tint',
  verwerkt: 'border-green bg-green-tint',
  afgewezen: 'border-amber bg-amber-tint',
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-bold text-ink">Melding {{ code }}</h1>
      <!-- The instruction belongs to the form. Once the melding is on
           screen it read as a demand with nothing to type into (#321 §10). -->
      <p v-if="!status" class="mt-1 text-muted">
        Vul het e-mailadres in waarmee u deze melding heeft gedaan.
      </p>
    </div>

    <form v-if="!status" class="flex flex-col gap-3" @submit.prevent="look">
      <label class="block">
        <span class="mb-1 block font-semibold text-ink">E-mailadres</span>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="go"
          class="min-h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base
                 focus:border-brand focus:ring-2 focus:ring-brand-tint focus:outline-none"
        />
      </label>

      <button
        type="submit"
        :disabled="looking || !email.trim()"
        class="min-h-14 rounded-xl bg-brand px-4 font-bold text-white disabled:bg-line-strong disabled:text-muted"
      >
        {{ looking ? 'Zoeken…' : 'Melding bekijken' }}
      </button>

      <p v-if="missed" class="rounded-xl border border-amber bg-amber-tint px-4 py-3 text-ink">
        Wij vinden geen melding met deze code en dit e-mailadres.
      </p>
    </form>

    <template v-else>
      <div class="rounded-xl border p-5" :class="tone[status.state]">
        <p class="text-sm font-semibold tracking-wide text-muted uppercase">Status</p>
        <p class="mt-1 text-xl font-bold text-ink">{{ status.state }}</p>
        <p class="mt-2 text-body">{{ status.explanation }}</p>
      </div>

      <dl class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <div>
          <dt class="text-sm text-muted">Pand</dt>
          <dd class="font-semibold text-ink">{{ status.address }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Ontvangen op</dt>
          <dd class="font-semibold text-ink">{{ status.received }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Meegestuurde documenten</dt>
          <dd class="font-semibold text-ink">{{ status.attachments }}</dd>
        </div>
      </dl>

      <NuxtLink to="/" class="text-brand-ink underline-offset-2 hover:underline">
        Nog een melding doen
      </NuxtLink>
    </template>
  </section>
</template>
