import { XMLParser, XMLValidator } from 'fast-xml-parser'

const GOOGLE_TRENDS_URL = 'https://trends.google.com/trending/rss'
const GOOGLE_TIMEOUT_MS = 10_000
const PARSER = new XMLParser({ parseTagValue: false, processEntities: true })

export function parseGoogleTrendTags(xml: string): string[] {
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid Google Trends XML')
  const items = PARSER.parse(xml)?.rss?.channel?.item
  const entries = Array.isArray(items) ? items : items ? [items] : []
  const tags = [...new Set<string>(entries.flatMap((item: { title?: unknown }) => {
    if (typeof item.title !== 'string') return []
    const tag = item.title.trim()
    return tag ? [tag] : []
  }))].slice(0, 30)
  if (!tags.length) throw new Error('Google Trends returned no keywords')
  return tags
}

export function normaliseTrendCountry(country = 'US'): string {
  return /^[a-z]{2}$/i.test(country) ? country.toUpperCase() : 'US'
}

export const fetchGoogleTrendTags = defineCachedFunction(async (country = 'US'): Promise<string[]> => {
  const xml = await $fetch<string>(GOOGLE_TRENDS_URL, {
    query: { geo: normaliseTrendCountry(country) },
    responseType: 'text', timeout: GOOGLE_TIMEOUT_MS, retry: 0
  })
  return parseGoogleTrendTags(xml)
}, {
  name: 'google-trends-country-keyword-tags',
  getKey: (country = 'US') => normaliseTrendCountry(country),
  maxAge: 21600,
  swr: false
})

export async function fetchGoogleTrendDefaults(country: string): Promise<{ default_tags: string[], trend_country: string }> {
  const requested_country = normaliseTrendCountry(country)
  try {
    return { default_tags: await fetchGoogleTrendTags(requested_country), trend_country: requested_country }
  } catch {
    if (requested_country !== 'US') {
      const default_tags = await fetchGoogleTrendTags('US').catch(() => [])
      return { default_tags, trend_country: 'US' }
    }
    return { default_tags: [], trend_country: 'US' }
  }
}
