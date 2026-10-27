import { z } from 'zod'
import { NEWS_LANGUAGES } from './news'

const SOURCE_NAME = z.string().max(253).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/, 'Use a source name such as bbc or apnews, without a URL.')
const list = (item: z.ZodType<string>) => z.array(item).max(30, 'Use at most 30 entries.').default([])
export const PREFERENCE_SCHEMA = z.object({
  topic: z.string().trim().max(500, 'Use at most 500 characters.').default(''),
  tags: list(z.string().trim().min(1).max(500)),
  domains: list(SOURCE_NAME),
  exclude_domains: list(SOURCE_NAME),
  languages: list(z.string().refine(value => NEWS_LANGUAGES.includes(value), 'Choose a supported language value.'))
}).strict().superRefine((value, context) => {
  if (!value.topic && ![value.tags, value.domains, value.exclude_domains, value.languages].some(values => values.length)) {
    context.addIssue({ code: 'custom', path: ['topic'], message: 'Enter at least one preference.' })
  }
  if (value.domains.some(domain => value.exclude_domains.includes(domain))) {
    context.addIssue({ code: 'custom', path: ['exclude_domains'], message: 'A source cannot be included and excluded.' })
  }
})
export type PreferenceValues = z.infer<typeof PREFERENCE_SCHEMA>
export interface UserPreference extends PreferenceValues { version: number, updated_at: string }
export interface PreferenceState { preference: UserPreference | null, error_message: string | null }
export interface PreferenceDraft { topic: string, tags: string, domains: string, exclude_domains: string, languages: string }
export const EMPTY_PREFERENCE: PreferenceDraft = { topic: '', tags: '', domains: '', exclude_domains: '', languages: '' }
export const PREFERENCE_FIELDS = [
  { name: 'topic', label: 'Topic', placeholder: 'AI and small business', help: 'One topic or semantic search query.' },
  { name: 'tags', label: 'Tags', placeholder: 'automation, productivity', help: 'Separate values with commas.' },
  { name: 'domains', label: 'Sources', placeholder: 'bbc, apnews', help: 'Stored source names, separated by commas; omit URLs.' },
  { name: 'exclude_domains', label: 'Exclude sources', placeholder: 'example', help: 'Stored source names to omit, separated by commas.' },
  { name: 'languages', label: 'Languages', placeholder: 'en, en-us', help: `Supported values: ${NEWS_LANGUAGES.join(', ')}.` }
] as const

export function normalisePreferences(input: PreferenceDraft | PreferenceValues): PreferenceValues {
  const split = (value: string | string[], tags = false) => [...new Set((Array.isArray(value) ? value : [value])
    .flatMap(item => item.split(',')).map(item => item.trim().toLowerCase()).filter(Boolean)
    .map(item => tags ? item.replaceAll(/\s+/g, '_') : item))]
  return { topic: input.topic.trim(), tags: split(input.tags, true), domains: split(input.domains), exclude_domains: split(input.exclude_domains), languages: split(input.languages) }
}
