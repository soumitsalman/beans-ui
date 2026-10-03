import { createError, getQuery, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'

const PATH_PATTERN = /^[a-z0-9/-]+$/i
const fetchPublicFeed = defineCachedFunction((url: string, query: Record<string, unknown>, api_key?: string) => $fetch(url, {
  query,
  headers: api_key ? { 'X-API-KEY': api_key } : undefined,
  timeout: 60_000
}), {
  name: 'public-presentation-feed',
  maxAge: 30,
  swr: false,
  getKey: (url, query, api_key) => createHash('sha256').update(JSON.stringify([url, query, api_key])).digest('hex')
})

export async function proxyApi(event: H3Event, api_base_url: string, api_key?: string): Promise<unknown> {
  const path = getRouterParam(event, 'path')

  if (!path || !PATH_PATTERN.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid API path.' })
  }

  const url = `${api_base_url.replace(/\/$/, '')}/${path}`
  // Only the public feed is shared; search queries, detail failures and user input are not cached.
  if (path === 'private/articles/unique') return fetchPublicFeed(url, getQuery(event), api_key)
  return $fetch(url, {
    query: getQuery(event),
    headers: api_key ? { 'X-API-KEY': api_key } : undefined,
    timeout: 60_000
  })
}
