import { createError, getQuery, getRouterParam } from 'h3'
import type { H3Event } from 'h3'

const PATH_PATTERN = /^[a-z0-9/-]+$/i

export async function proxyApi(event: H3Event, api_base_url: string, api_key?: string): Promise<unknown> {
  const path = getRouterParam(event, 'path')

  if (!path || !PATH_PATTERN.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid API path.' })
  }

  return $fetch(`${api_base_url.replace(/\/$/, '')}/${path}`, {
    query: getQuery(event),
    headers: api_key ? { 'X-API-KEY': api_key } : undefined,
    timeout: 60_000
  })
}
