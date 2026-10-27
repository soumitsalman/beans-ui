import { createHash } from 'node:crypto'
import { UPSTREAM_TIMEOUT_MS } from '../../shared/actionTiming'

const DISCOVERY_CACHE_SECONDS = 12 * 60 * 60

function feedCacheKey(url: string, query: Record<string, unknown>, api_key?: string): string {
  return createHash('sha256').update(JSON.stringify([url, query, api_key])).digest('hex')
}

async function fetchUpstream(url: string, query: Record<string, unknown>, api_key?: string, signal?: AbortSignal): Promise<unknown> {
  const fetch_signal = signal ? AbortSignal.any([signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]) : undefined
  try {
    return await $fetch(url, {
      query,
      headers: api_key ? { 'X-API-KEY': api_key } : undefined,
      timeout: UPSTREAM_TIMEOUT_MS,
      retry: 0,
      signal: fetch_signal
    })
  } catch (error) {
    const failure = error as { cause?: { name?: string } }
    if (fetch_signal?.aborted || ['TimeoutError', 'AbortError'].includes(failure.cause?.name ?? '')) {
      throw createError({ statusCode: 503, statusMessage: 'News took too long to load. Please retry.' })
    }
    throw error
  }
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

export async function fetchPresentationApi<T>(api_base_url: string, path: string, query: Record<string, unknown> = {}, api_key?: string, signal?: AbortSignal, private_request = false): Promise<T> {
  signal?.throwIfAborted()
  const url = `${api_base_url.replace(/\/$/, '')}/${path}`
  if (private_request) return fetchUpstream(url, query, api_key, signal) as Promise<T>
  if (path === 'articles/latest' || path === 'preview/stories') {
    return (isDiscoverySearch(query) ? fetchDiscoverySearch(url, query, api_key) : fetchPublicFeed(url, query, api_key)) as Promise<T>
  }
  return fetchUpstream(url, query, api_key, signal) as Promise<T>
}
