import { XMLParser, XMLValidator } from 'fast-xml-parser'

const GOOGLE_TRENDS_URL = 'https://trends.google.com/trending/rss?geo=US'
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

export const fetchGoogleTrendTags = defineCachedFunction(async (): Promise<string[]> => {
  const xml = await $fetch<string>(GOOGLE_TRENDS_URL, {
    responseType: 'text', timeout: GOOGLE_TIMEOUT_MS, retry: 0
  })
  return parseGoogleTrendTags(xml)
}, {
  name: 'google-trends-us-keyword-tags',
  maxAge: 21600,
  swr: false
})
