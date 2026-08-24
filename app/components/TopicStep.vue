<script setup lang="ts">
import { TOPICS, FOUNDATION_GROUPS, RECOVERY_TYPES, RISK_DIRECTIONS, RISK_CLASSES } from '~/services/contract'
import type { TopicKey } from '~/services/contract'

/**
 * Step 2 — what are you telling us.
 *
 * One choice opens one branch. Radio cards rather than a dropdown: on a phone a
 * select hides every option behind a tap, and the choice here decides what the
 * melder has to supply. Seeing all six at once is worth the scroll.
 */
const topic = defineModel<TopicKey | null>('topic')
const foundationType = defineModel<string>('foundationType')
const recoveryType = defineModel<string>('recoveryType')
const registration = defineModel<string>('registration')
const riskDirection = defineModel<string>('riskDirection')
const riskClass = defineModel<string>('riskClass')

const chosen = computed(() => TOPICS.find((t) => t.key === topic.value) ?? null)
</script>

<template>
  <section class="flex flex-col gap-3">
    <div>
      <h2 class="text-xl font-bold text-ink">Wat wilt u doorgeven?</h2>
      <p class="mt-1 text-muted">Kies één onderwerp.</p>
    </div>

    <div class="flex flex-col gap-2">
      <label
        v-for="t in TOPICS"
        :key="t.key"
        class="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border bg-surface px-4 py-3"
        :class="topic === t.key ? 'border-brand ring-2 ring-brand-tint' : 'border-line hover:border-line-strong'"
      >
        <input
          v-model="topic"
          type="radio"
          :value="t.key"
          name="onderwerp"
          class="mt-1 h-5 w-5 shrink-0 accent-brand"
        />
        <span class="min-w-0">
          <span class="block font-semibold text-ink">{{ t.label }}</span>
          <span class="block text-sm text-muted">{{ t.hint }}</span>
        </span>
      </label>
    </div>

    <!-- The branch. Only what this topic needs, nothing else. -->
    <div v-if="chosen" class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <template v-if="chosen.key === 'foundationType'">
        <label class="block">
          <span class="block font-semibold text-ink">Wat is het funderingstype?</span>
          <span class="mb-2 block text-sm text-muted">Weet u het niet zeker? Laat het leeg.</span>
          <select v-model="foundationType" class="min-h-13 w-full rounded-xl border border-line-strong bg-surface px-3 text-base">
            <option value="">Weet ik niet</option>
            <option v-for="g in FOUNDATION_GROUPS" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </label>
      </template>

      <template v-else-if="chosen.key === 'recoveryType'">
        <label class="block">
          <span class="block font-semibold text-ink">Welk soort herstel?</span>
          <select v-model="recoveryType" required class="mt-2 min-h-13 w-full rounded-xl border border-line-strong bg-surface px-3 text-base">
            <option value="">Kies een soort herstel</option>
            <option v-for="r in RECOVERY_TYPES" :key="r.value" :value="r.label">{{ r.label }}</option>
          </select>
        </label>
      </template>

      <template v-else-if="chosen.key === 'quickscan'">
        <label class="block">
          <span class="block font-semibold text-ink">Registratienummer</span>
          <span class="mb-2 block text-sm text-muted">Het REG- of NAFO-nummer, als u het bij de hand heeft.</span>
          <input v-model="registration" inputmode="text" placeholder="Bijv. REG-0001981"
                 class="min-h-13 w-full rounded-xl border border-line-strong bg-surface px-4 text-base placeholder:text-faint" />
        </label>
      </template>

      <template v-else-if="chosen.key === 'noDamage'">
        <fieldset class="flex flex-col gap-2">
          <legend class="font-semibold text-ink">In welke richting klopt het niet?</legend>
          <label v-for="d in RISK_DIRECTIONS" :key="d.value"
                 class="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3"
                 :class="riskDirection === d.value ? 'border-brand bg-brand-tint' : 'border-line'">
            <input v-model="riskDirection" type="radio" :value="d.value" name="richting" class="h-5 w-5 accent-brand" />
            <span>{{ d.label }}</span>
          </label>
        </fieldset>
        <label class="block">
          <span class="block font-semibold text-ink">Welke klasse zou het moeten zijn?</span>
          <span class="mb-2 block text-sm text-muted">A is het laagste risico, E het hoogste. Optioneel.</span>
          <div class="flex gap-2">
            <button v-for="c in RISK_CLASSES" :key="c" type="button"
                    class="min-h-12 flex-1 rounded-lg border font-semibold"
                    :class="riskClass === c ? 'border-brand bg-brand-tint text-brand-ink' : 'border-line bg-surface'"
                    @click="riskClass = riskClass === c ? '' : c">{{ c }}</button>
          </div>
        </label>
      </template>

      <p v-if="chosen.evidenceHint" class="text-sm text-muted">{{ chosen.evidenceHint }}</p>
    </div>
  </section>
</template>
