/**
 * The submission contract.
 *
 * These key names and Dutch labels are not cosmetic. The triage rules and the
 * handler views match on the literal strings, and every submission already made
 * carries them. Rename nothing here without shipping a mapping in the same
 * commit — a silent rename breaks routing for the whole back catalogue.
 *
 * `noDamage` is the clearest example: the topic was once "er is geen schade"
 * and is now "wijzig funderingsrisico". The key was deliberately never renamed.
 */
export const FORM_VERSION = 'versie 2.0'

export type TopicKey =
  | 'foundationType'
  | 'recoveryType'
  | 'quickscan'
  | 'foundationResearch'
  | 'noDamage'
  | 'other'

export interface Topic {
  key: TopicKey
  label: string
  /** What the melder is actually holding, in their words. */
  hint: string
  /** Four of six cannot be processed without evidence; the form blocks on these. */
  evidenceRequired: boolean
  /** Shown when they have nothing to attach. */
  evidenceHint?: string
}

export const TOPICS: readonly Topic[] = [
  {
    key: 'foundationType',
    label: 'Het funderingstype klopt niet',
    hint: 'U weet wat er onder het pand zit, en bij ons staat iets anders.',
    evidenceRequired: true,
    evidenceHint: 'Voeg de archieftekening of het onderzoek toe waar dat uit blijkt.',
  },
  {
    key: 'recoveryType',
    label: 'De fundering is hersteld',
    hint: 'Er is funderingsherstel uitgevoerd aan dit pand.',
    evidenceRequired: true,
    evidenceHint: 'Voeg de factuur, de oplevering of het onderzoek toe.',
  },
  {
    key: 'quickscan',
    label: 'Ik lever een QuickScan aan',
    hint: 'Een Fase 0-rapport of QuickScan funderingsrisico.',
    evidenceRequired: true,
    evidenceHint: 'Voeg het rapport zelf toe.',
  },
  {
    key: 'foundationResearch',
    label: 'Ik lever een funderingsonderzoek aan',
    hint: 'Een Fase 1- of Fase 2-onderzoek.',
    evidenceRequired: true,
    evidenceHint: 'Voeg het rapport toe en kies “Funderingsonderzoek” als soort.',
  },
  {
    key: 'noDamage',
    label: 'Het funderingsrisico klopt niet',
    hint: 'De risicoklasse die wij tonen past niet bij dit pand.',
    evidenceRequired: false,
  },
  {
    key: 'other',
    label: 'Iets anders',
    hint: 'Een vraag, of iets dat hier niet tussen staat.',
    evidenceRequired: false,
  },
] as const

/** Groups, not the full 18 database values: a melder is not picking an enum. */
export const FOUNDATION_GROUPS = [
  { value: 'houten_palen', label: 'Houten paalfundering' },
  { value: 'houten_palen_oplanger', label: 'Houten palen met betonoplanger' },
  { value: 'op_staal', label: 'Ondiepe fundering (op staal)' },
  { value: 'betonpalen', label: 'Betonpaalfundering' },
  { value: 'overig', label: 'Overig' },
] as const

export const RECOVERY_TYPES = [
  { value: 'tafelmethode', label: 'Tafelmethode' },
  { value: 'paalkop_verlaging', label: 'Paalkop verlaging' },
  { value: 'paal_in_wand', label: 'Paal in wand' },
  { value: 'grondinjectie', label: 'Grondinjectie' },
  { value: 'partieel_herstel', label: 'Partieel herstel' },
  { value: 'paalkopverhoging', label: 'Paalkopverhoging' },
] as const

export const RISK_DIRECTIONS = [
  { value: 'Lager risico', label: 'Het risico is lager dan u toont' },
  { value: 'Hoger risico', label: 'Het risico is hoger dan u toont' },
  { value: 'Anders / weet niet', label: 'Anders, of ik weet het niet' },
] as const

export const RISK_CLASSES = ['A', 'B', 'C', 'D', 'E'] as const

/**
 * Attachment categories. This label per file is the strongest automatic signal
 * the back end gets — a file marked `herstelbewijs` routes to the recovery
 * workflow whatever topic was chosen — and `quickscan` is what stops the
 * pipeline reading a foundation type back off our own data.
 */
export const ATTACHMENT_CATEGORIES = [
  { value: 'archieveresearch', label: 'Bouwtekening / archiefstuk' },
  { value: 'foundationresearch', label: 'Funderingsonderzoek (Fase 1 of 2)' },
  { value: 'quickscan', label: 'QuickScan / Fase 0' },
  { value: 'herstelbewijs', label: 'Bewijs van funderingsherstel' },
  { value: 'foto', label: "Foto's van de woning" },
  { value: 'overig', label: 'Anders / weet ik niet' },
] as const

export const REPORTER_TYPES = [
  { value: 'resident', label: 'Particulier / bewoner', company: false },
  { value: 'broker', label: 'Makelaar / taxateur', company: true, companyLabel: 'Bedrijfsnaam (kantoor)' },
  { value: 'municipality', label: 'Gemeente', company: true, companyLabel: 'Naam gemeente' },
  { value: 'company', label: 'Bedrijf', company: true, companyLabel: 'Bedrijfsnaam' },
  { value: 'other', label: 'Anders', company: false },
] as const

export const MAX_FILES = 10
export const MAX_FILE_BYTES = 25 * 1024 * 1024
