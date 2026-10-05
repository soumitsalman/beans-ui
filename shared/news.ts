const FALLBACK_SCORE_THRESHOLD = 0.6

export function defaultScoreThreshold(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) return FALLBACK_SCORE_THRESHOLD
  return parsed
}

export const NEWS_LANGUAGES = [
  'en', 'en-ae', 'en-at', 'en-au', 'en-be', 'en-ca', 'en-de', 'en-en', 'en-gb', 'en-ie', 'en-in',
  'en-mt', 'en-nz', 'en-pk', 'en-se', 'en-sg', 'en-sv', 'en-uk', 'en-us', 'en-za', 'english'
]
