export const OUTBOUND_UTM_SOURCE = 'beans.cafecito.tech'
export const OUTBOUND_UTM_MEDIUM = 'referral'
export const UTM_SOURCE_PARAM = 'utm_source'
export const UTM_MEDIUM_PARAM = 'utm_medium'

const BEANS_HOSTS = new Set([
  'beans.cafecito.tech',
  'www.beans.cafecito.tech'
])
const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

export function withOutboundReferral(
  href?: string | null,
  site_origin?: string | null
): string | undefined {
  if (href == null) return undefined

  const url_value = href.trim()
  if (!url_value) return href
  if (isAppRelative(url_value)) return href

  const parsed_url = parseAbsoluteUrl(url_value)
  if (!parsed_url) return href
  if (!HTTP_PROTOCOLS.has(parsed_url.protocol)) return href
  if (isInternalHost(parsed_url.hostname, site_origin)) return href

  const needs_source = !parsed_url.searchParams.has(UTM_SOURCE_PARAM)
  const needs_medium = !parsed_url.searchParams.has(UTM_MEDIUM_PARAM)
  if (!needs_source && !needs_medium) return href

  if (needs_source) parsed_url.searchParams.set(UTM_SOURCE_PARAM, OUTBOUND_UTM_SOURCE)
  if (needs_medium) parsed_url.searchParams.set(UTM_MEDIUM_PARAM, OUTBOUND_UTM_MEDIUM)

  return parsed_url.toString()
}

function isAppRelative(value: string): boolean {
  if (value.startsWith('#') || value.startsWith('?')) return true
  if (value.startsWith('//')) return false
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return true
  return !SCHEME_PATTERN.test(value)
}

function parseAbsoluteUrl(value: string): URL | undefined {
  try {
    return value.startsWith('//') ? new URL(`https:${value}`) : new URL(value)
  } catch {
    return undefined
  }
}

function isInternalHost(hostname: string, site_origin?: string | null): boolean {
  const host = hostname.toLowerCase()
  if (BEANS_HOSTS.has(host)) return true

  const site_host = originHost(site_origin)
  return Boolean(site_host && host === site_host)
}

function originHost(site_origin?: string | null): string | undefined {
  const origin_value = site_origin?.trim()
  if (!origin_value) return undefined

  try {
    return new URL(origin_value.includes('://') ? origin_value : `https://${origin_value}`).hostname.toLowerCase()
  } catch {
    return undefined
  }
}
