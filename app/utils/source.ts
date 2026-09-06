import type { NewsSource } from '~/types/news'

interface SourceArticle {
  source?: NewsSource | null
  url?: string | null
}

export const DEFAULT_SOURCE_ICON = 'lucide:newspaper'

function nonEmptyValue(value?: string | null): string | undefined {
  return value?.trim() || undefined
}

export function baseUrl(value?: string | null): string | undefined {
  const url_value = nonEmptyValue(value)
  if (!url_value) return undefined

  try {
    const parsed_url = new URL(url_value.includes('://') ? url_value : `https://${url_value}`)
    return `${parsed_url.protocol}//${parsed_url.host}`
  } catch {
    return undefined
  }
}

function baseUrlWithoutScheme(value?: string | null): string | undefined {
  const url_value = nonEmptyValue(value)
  if (!url_value) return undefined

  try {
    const parsed_url = new URL(url_value.includes('://') ? url_value : `https://${url_value}`)
    return parsed_url.host
  } catch {
    return undefined
  }
}

export function favicon(value?: string | null): string | undefined {
  const base_url = baseUrl(value)
  return base_url ? `${base_url}/favicon.ico` : undefined
}

export function sourceLabel(article?: SourceArticle | null): string | undefined {
  return nonEmptyValue(article?.source?.site_name)
    || nonEmptyValue(article?.source?.domain_name)
    || nonEmptyValue(article?.source?.name)
    || nonEmptyValue(article?.source?.domain)
    || baseUrlWithoutScheme(article?.url)
}

export function sourceFavicon(article?: SourceArticle | null): string | undefined {
  return nonEmptyValue(article?.source?.favicon_url)
    || nonEmptyValue(article?.source?.favicon)
    || favicon(article?.url)
}
