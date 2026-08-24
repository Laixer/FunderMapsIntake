<script setup lang="ts">
import { REPORTER_TYPES, type ReporterType } from '~/services/contract'

/**
 * Step 4 — who is telling us.
 *
 * Last on purpose. Asking for a name and an email before anything has been
 * invested reads as a wall; asking once the melder has already picked their
 * house and attached a document reads as finishing.
 *
 * Email is the only required contact field, and the form says why: it is how
 * the meldcode comes back. Everything else is optional.
 */
const type = defineModel<ReporterType | null>('type')
const name = defineModel<string>('name')
const email = defineModel<string>('email')
const phone = defineModel<string>('phone')
const company = defineModel<string>('company')
const owner = defineModel<boolean>('owner')
const note = defineModel<string>('note')

const chosen = computed(() => REPORTER_TYPES.find((r) => r.value === type.value) ?? null)
const needsCompany = computed(() => chosen.value?.company === true)

const field =
  'min-h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base placeholder:text-faint ' +
  'focus:border-brand focus:ring-2 focus:ring-brand-tint focus:outline-none'
</script>

<template>
  <section class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-bold text-ink">Uw gegevens</h2>
      <p class="mt-1 text-muted">
        Zodat wij u de meldcode kunnen sturen en contact kunnen opnemen als er
        iets onduidelijk is.
      </p>
    </div>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 font-semibold text-ink">Namens wie meldt u dit?</legend>
      <label
        v-for="r in REPORTER_TYPES"
        :key="r.value"
        class="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3"
        :class="type === r.value ? 'border-brand bg-brand-tint' : 'border-line bg-surface'"
      >
        <input v-model="type" type="radio" :value="r.value" name="melder" class="h-5 w-5 accent-brand" />
        <span>{{ r.label }}</span>
      </label>
    </fieldset>

    <label v-if="needsCompany" class="block">
      <span class="mb-1 block font-semibold text-ink">{{ chosen?.companyLabel }}</span>
      <input v-model="company" type="text" autocomplete="organization" :class="field" />
    </label>

    <label class="block">
      <span class="mb-1 block font-semibold text-ink">Naam</span>
      <input v-model="name" type="text" autocomplete="name" enterkeyhint="next" :class="field" />
    </label>

    <label class="block">
      <span class="block font-semibold text-ink">E-mailadres</span>
      <span class="mb-1 block text-sm text-muted">Hier sturen wij uw meldcode naartoe.</span>
      <input
        v-model="email"
        type="email"
        inputmode="email"
        autocomplete="email"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="next"
        required
        :class="field"
      />
    </label>

    <label class="block">
      <span class="block font-semibold text-ink">Telefoonnummer <span class="font-normal text-muted">(optioneel)</span></span>
      <input v-model="phone" type="tel" inputmode="tel" autocomplete="tel" :class="field" />
    </label>

    <label class="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface px-3 py-3">
      <input v-model="owner" type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
      <span>Ik ben eigenaar van dit pand</span>
    </label>

    <label class="block">
      <span class="block font-semibold text-ink">Toelichting <span class="font-normal text-muted">(optioneel)</span></span>
      <span class="mb-1 block text-sm text-muted">Alles wat wij moeten weten om dit goed te beoordelen.</span>
      <textarea v-model="note" rows="4" :class="field.replace('min-h-13', 'min-h-24') + ' py-3'" />
    </label>
  </section>
</template>
