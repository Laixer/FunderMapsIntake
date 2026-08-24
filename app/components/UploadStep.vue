<script setup lang="ts">
import { ATTACHMENT_CATEGORIES, MAX_FILES, DEFAULT_CATEGORY, type AttachmentCategory, type TopicKey } from '~/services/contract'
import { humanSize, type Upload } from '~/composables/useUploads'

/**
 * Step 3 — the evidence.
 *
 * Four of the six topics cannot be processed without a file, so this step is
 * the one that decides whether a submission is worth anything. Files upload on
 * selection: by the time the melder reaches "Versturen" the bytes are already
 * in the bucket and the button is instant.
 */
const props = defineProps<{
  topic: TopicKey | null
  required: boolean
  uploads: Upload[]
  rejected: string[]
}>()

const emit = defineEmits<{
  add: [files: FileList, category: AttachmentCategory]
  remove: [id: string]
  retry: [id: string]
  dismiss: [index: number]
}>()

const input = ref<HTMLInputElement | null>(null)
const full = computed(() => props.uploads.length >= MAX_FILES)

function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  if (el.files?.length) {
    emit('add', el.files, props.topic ? DEFAULT_CATEGORY[props.topic] : 'overig')
  }
  // Reset, so picking the same file twice in a row still fires a change event.
  el.value = ''
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div>
      <h2 class="text-xl font-bold text-ink">
        Documenten
        <span v-if="!required" class="font-normal text-muted">(optioneel)</span>
      </h2>
      <p class="mt-1 text-muted">
        <template v-if="required">
          Zonder document kunnen wij dit niet verwerken. PDF of foto, maximaal
          {{ MAX_FILES }} bestanden.
        </template>
        <template v-else>
          Heeft u een rapport, tekening of foto? Voeg het toe — dat maakt de
          melding veel bruikbaarder.
        </template>
      </p>
    </div>

    <!-- Files that never made it in. Named, with the reason, and dismissable. -->
    <ul v-if="rejected.length" class="flex flex-col gap-2">
      <li
        v-for="(r, i) in rejected"
        :key="r + i"
        class="flex items-start gap-3 rounded-xl border border-red bg-red-tint px-4 py-3 text-sm"
      >
        <span class="min-w-0 flex-1 text-ink">{{ r }}</span>
        <button type="button" class="shrink-0 font-semibold text-red" @click="emit('dismiss', i)">
          Sluiten
        </button>
      </li>
    </ul>

    <ul v-if="uploads.length" class="flex flex-col gap-2">
      <li
        v-for="u in uploads"
        :key="u.id"
        class="rounded-xl border bg-surface px-4 py-3"
        :class="u.state === 'failed' ? 'border-red' : 'border-line'"
      >
        <div class="flex items-start gap-3">
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold text-ink">{{ u.name }}</span>
            <span class="block text-sm text-muted">
              {{ humanSize(u.size) }}
              <template v-if="u.state === 'uploading'"> · uploaden…</template>
              <template v-else-if="u.state === 'failed'"> · {{ u.error }}</template>
            </span>
          </span>
          <button
            v-if="u.state === 'failed'"
            type="button"
            class="min-h-11 shrink-0 px-2 font-semibold text-brand-ink"
            @click="emit('retry', u.id)"
          >
            Opnieuw
          </button>
          <button
            v-else
            type="button"
            class="min-h-11 shrink-0 px-2 font-semibold text-muted hover:text-red"
            :aria-label="`${u.name} verwijderen`"
            @click="emit('remove', u.id)"
          >
            Verwijderen
          </button>
        </div>

        <div v-if="u.state === 'uploading'" class="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div
            class="h-full bg-brand transition-[width] duration-200"
            :style="{ width: `${Math.round(u.progress * 100)}%` }"
          />
        </div>

        <!-- The one question that matters per file. A QuickScan states a
             foundation type it read off our own map, so this label is what
             stops us learning our own answer back. -->
        <label v-if="u.state === 'done'" class="mt-3 block">
          <span class="mb-1 block text-sm font-semibold text-ink">Wat voor document is dit?</span>
          <select
            v-model="u.category"
            class="min-h-12 w-full rounded-lg border border-line-strong bg-surface px-3 text-base"
          >
            <option v-for="c in ATTACHMENT_CATEGORIES" :key="c.value" :value="c.value">
              {{ c.label }}
            </option>
          </select>
        </label>
      </li>
    </ul>

    <input
      ref="input"
      type="file"
      multiple
      accept="application/pdf,image/*"
      class="sr-only"
      @change="onPick"
    />
    <button
      type="button"
      :disabled="full"
      class="min-h-14 rounded-xl border-2 border-dashed border-line-strong bg-surface px-4
             font-semibold text-brand-ink disabled:opacity-50"
      @click="input?.click()"
    >
      <template v-if="full">Maximum van {{ MAX_FILES }} bestanden bereikt</template>
      <template v-else-if="uploads.length">Nog een bestand toevoegen</template>
      <template v-else>Bestand kiezen of foto maken</template>
    </button>
  </section>
</template>
