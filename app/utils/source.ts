import type { NewsSource } from '~/types/news'

interface SourceArticle {
  source?: NewsSource | null
  url?: string | null
}

export const DEFAULT_SOURCE_ICON = 'lucide:newspaper'

function nonEmptyValue(value?: string | null): string | undefined {
  return value?.trim() || undefined
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

export function sourceLabel(article?: SourceArticle | null): string | undefined {
  return nonEmptyValue(article?.source?.site_name)
    || nonEmptyValue(article?.source?.domain_name)
    || nonEmptyValue(article?.source?.name)
    || nonEmptyValue(article?.source?.domain)
    || baseUrlWithoutScheme(article?.source?.base_url || article?.source?.url)
    || baseUrlWithoutScheme(article?.url)
}

export function hasResolvableSource(article?: SourceArticle | null): boolean {
  return Boolean(sourceIdentity(article) || sourceFavicon(article) || sourceLabel(article))
}

export function sourceIdentity(article?: SourceArticle | null): string | undefined {
  return nonEmptyValue(article?.source?.id)
    || baseUrlWithoutScheme(article?.source?.base_url)
    || baseUrlWithoutScheme(article?.source?.url)
    || baseUrlWithoutScheme(article?.source?.domain_name)
    || baseUrlWithoutScheme(article?.source?.domain)
    || baseUrlWithoutScheme(article?.url)
    || nonEmptyValue(article?.source?.site_name)
    || nonEmptyValue(article?.source?.name)
}

export function sourceFavicon(article?: SourceArticle | null): string | undefined {
  return nonEmptyValue(article?.source?.favicon_url)
    || nonEmptyValue(article?.source?.favicon)
    || googleFavicon(article?.url || article?.source?.base_url || article?.source?.url || article?.source?.domain_name || article?.source?.domain)
}

function googleFavicon(value?: string | null): string | undefined {
  const domain_name = baseUrlWithoutScheme(value)
  return domain_name
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain_name)}&sz=64`
    : undefined
}
