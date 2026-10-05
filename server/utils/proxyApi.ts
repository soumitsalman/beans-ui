import { createError, getQuery, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'

const PATH_PATTERN = /^[a-z0-9/-]+$/i
const DISCOVERY_CACHE_SECONDS = 12 * 60 * 60

function feedCacheKey(url: string, query: Record<string, unknown>, api_key?: string): string {
  return createHash('sha256').update(JSON.stringify([url, query, api_key])).digest('hex')
}

function fetchUpstream(url: string, query: Record<string, unknown>, api_key?: string): Promise<unknown> {
  return $fetch(url, {
    query,
    headers: api_key ? { 'X-API-KEY': api_key } : undefined,
    timeout: 60_000
  })
}

const fetchPublicFeed = defineCachedFunction(fetchUpstream, {
  name: 'public-presentation-feed',
  maxAge: 30,
  swr: false,
  getKey: feedCacheKey
})

// Thrown upstream failures never reach storage; only a resolved response is cached.
const fetchDiscoverySearch = defineCachedFunction(fetchUpstream, {
  name: 'home-discovery-search',
  maxAge: DISCOVERY_CACHE_SECONDS,
  swr: false,
  getKey: feedCacheKey
})

function queryText(value: unknown): string {
  if (Array.isArray(value)) return value.map(item => String(item ?? '')).join('')
  if (value == null) return ''
  return String(value)
}

function isDiscoverySearch(query: Record<string, unknown>): boolean {
  return Boolean(
    queryText(query.q).trim()
    || queryText(query.tags).trim()
    || queryText(query.search_threshold).trim()
    || queryText(query.score_threshold).trim()
  )
}

export async function proxyApi(event: H3Event, api_base_url: string, api_key?: string): Promise<unknown> {
  const path = getRouterParam(event, 'path')

  if (!path || !PATH_PATTERN.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid API path.' })
  }

  const url = `${api_base_url.replace(/\/$/, '')}/${path}`
  // Trending, latest, and source feeds share a 30-second cache. Home discovery searches use a separate 12-hour cache.
  if (path === 'private/articles/unique') {
    const query = getQuery(event)
    return isDiscoverySearch(query) ? fetchDiscoverySearch(url, query, api_key) : fetchPublicFeed(url, query, api_key)
  }
  return $fetch(url, {
    query: getQuery(event),
    headers: api_key ? { 'X-API-KEY': api_key } : undefined,
    timeout: 60_000
  })
}
