<script setup lang="ts">
import { TOPICS, FORM_VERSION, type TopicKey, type ReporterType, type AttachmentCategory } from '~/services/contract'
import type { ResolvedAddress } from '~/composables/usePdok'

/**
 * The form.
 *
 * One scrolling page, revealed a step at a time, rather than a wizard. There is
 * nothing to navigate back to, nothing to lose on a reload of a step, and on a
 * phone the whole submission is one continuous motion. Four questions is not
 * enough content to justify four screens and a progress bar.
 */
const props = defineProps<{ prefill?: ResolvedAddress | null }>()

const submissionId = crypto.randomUUID?.() ?? String(Math.random()).slice(2)

const address = ref<ResolvedAddress | null>(props.prefill ?? null)
const topic = ref<TopicKey | null>(null)
const foundationType = ref('')
const recoveryType = ref('')
const registration = ref('')
const riskDirection = ref('')
const riskClass = ref('')

const reporterType = ref<ReporterType | null>(null)
const name = ref('')
const email = ref('')
const phone = ref('')
const company = ref('')
const owner = ref(false)
const note = ref('')

const { uploads, rejected, busy, settled, add, remove, retry, dismiss } = useUploads(() => submissionId)

const chosen = computed(() => TOPICS.find((t) => t.key === topic.value) ?? null)
const evidenceRequired = computed(() => chosen.value?.evidenceRequired ?? false)

// Steps appear in order; each needs the one before it answered.
const showTopic = computed(() => !!address.value)
// A topic handled elsewhere (herstel) ends the form at the topic step.
const external = computed(() => !!chosen.value?.externalUrl)
const showUpload = computed(() => showTopic.value && !!topic.value && !external.value)
const showContact = computed(() => showUpload.value && (!evidenceRequired.value || settled.value.length > 0))

/**
 * Bring a newly revealed step into view.
 *
 * Progressive disclosure has one failure mode on a phone: the next question
 * appears below the fold and the melder, seeing nothing change, assumes the tap
 * did nothing. Only fires on a real false-to-true transition after mount, so a
 * prefilled deep link does not yank the page on first paint.
 */
function revealOnce(source: Ref<boolean>) {
  const anchor = ref<HTMLElement | null>(null)
  watch(source, (now, before) => {
    if (!now || before) return
    nextTick(() => {
      anchor.value?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  })
  return anchor
}

const topicAnchor = revealOnce(showTopic)
const uploadAnchor = revealOnce(showUpload)
const contactAnchor = revealOnce(showContact)

const emailLooksReal = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))

/** Why the button is disabled, in the melder's words. Never a silent no-op. */
const blocker = computed(() => {
  if (!address.value) return 'Kies eerst een adres.'
  if (!topic.value) return 'Kies wat u wilt doorgeven.'
  if (external.value) return 'Dit onderwerp registreert u via het formulier hierboven.'
  if (evidenceRequired.value && settled.value.length === 0) return 'Voeg het document toe waar dit uit blijkt.'
  if (busy.value) return 'Een bestand wordt nog geüpload.'
  if (!emailLooksReal.value) return 'Vul een e-mailadres in waar wij u kunnen bereiken.'
  return null
})

const sending = ref(false)
const failure = ref('')
const receipt = ref<{ meldcode: string } | null>(null)

async function submit() {
  if (blocker.value || sending.value) return
  sending.value = true
  failure.value = ''
  try {
    receipt.value = await $fetch<{ meldcode: string }>('/api/submit', {
      method: 'POST',
      body: {
        submissionId,
        formVersion: FORM_VERSION,
        address: address.value,
        topic: topic.value,
        topicLabel: chosen.value?.label ?? '',
        answers: {
          foundationType: foundationType.value || undefined,
          recoveryType: recoveryType.value || undefined,
          registration: registration.value.trim() || undefined,
          riskDirection: riskDirection.value || undefined,
          riskClass: riskClass.value || undefined,
        },
        attachments: settled.value.map((u) => ({
          key: u.key,
          name: u.name,
          size: u.size,
          mime: u.mime,
          category: u.category,
        })),
        contact: {
          type: reporterType.value,
          name: name.value.trim(),
          email: email.value.trim(),
          phone: phone.value.trim() || undefined,
          company: company.value.trim() || undefined,
        },
        owner: owner.value,
        note: note.value.trim() || undefined,
      },
    })
  } catch {
    failure.value =
      'Het versturen is niet gelukt. Uw documenten zijn al opgeslagen — probeer het zo nog een keer.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <!-- Done. Everything above is gone; the meldcode is the only thing left. -->
  <SubmissionReceipt v-if="receipt" :meldcode="receipt.meldcode" :email="email" :address="address?.label ?? ''" />

  <form v-else class="flex flex-col gap-8" novalidate @submit.prevent="submit">
    <AddressStep v-model="address" />

    <template v-if="showTopic">
      <hr :ref="(el) => (topicAnchor = el as HTMLElement)" class="border-line scroll-mt-4" />
      <TopicStep
        v-model:topic="topic"
        v-model:foundation-type="foundationType"
        v-model:recovery-type="recoveryType"
        v-model:registration="registration"
        v-model:risk-direction="riskDirection"
        v-model:risk-class="riskClass"
      />
    </template>

    <template v-if="showUpload">
      <hr :ref="(el) => (uploadAnchor = el as HTMLElement)" class="border-line scroll-mt-4" />
      <UploadStep
        :topic="topic"
        :required="evidenceRequired"
        :uploads="uploads"
        :rejected="rejected"
        @add="(f: FileList, c: AttachmentCategory) => add(f, c)"
        @remove="remove"
        @retry="retry"
        @dismiss="dismiss"
      />
    </template>

    <template v-if="showContact">
      <hr :ref="(el) => (contactAnchor = el as HTMLElement)" class="border-line scroll-mt-4" />
      <ContactStep
        v-model:type="reporterType"
        v-model:name="name"
        v-model:email="email"
        v-model:phone="phone"
        v-model:company="company"
        v-model:owner="owner"
        v-model:note="note"
      />

      <div class="flex flex-col gap-3">
        <p v-if="failure" class="rounded-xl border border-red bg-red-tint px-4 py-3 text-ink">
          {{ failure }}
        </p>

        <button
          type="submit"
          :disabled="!!blocker || sending"
          class="min-h-14 w-full rounded-xl bg-brand px-4 text-lg font-bold text-white
                 disabled:bg-line-strong disabled:text-muted"
        >
          {{ sending ? 'Versturen…' : 'Melding versturen' }}
        </button>

        <p v-if="blocker" class="text-center text-sm text-muted">{{ blocker }}</p>
        <p class="text-center text-sm text-muted">
          Wij gebruiken uw gegevens alleen om deze melding te behandelen.
        </p>
      </div>
    </template>
  </form>
</template>
