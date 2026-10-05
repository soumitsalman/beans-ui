export const HOME_DISCOVERY_COOKIE = 'beans_home_discovery'

export interface HomeDiscoveryCriteria {
  query: string
  tags: string[]
}

export function homeDiscoveryCriteriaActive(value: unknown): value is HomeDiscoveryCriteria {
  if (!value || typeof value !== 'object') return false
  const criteria = value as Partial<HomeDiscoveryCriteria>
  const query = typeof criteria.query === 'string' ? criteria.query.trim() : ''
  const tags = Array.isArray(criteria.tags)
    ? criteria.tags.filter(tag => typeof tag === 'string' && tag.trim())
    : []
  return Boolean(query || tags.length)
}

export function homeDiscoveryCookieActive(raw?: string | null): boolean {
  if (!raw) return false

  const candidates = [raw]
  try {
    const decoded = decodeURIComponent(raw)
    if (decoded !== raw) candidates.push(decoded)
  } catch {
    // The cookie parser may already have decoded the value.
  }

  for (const candidate of candidates) {
    try {
      return homeDiscoveryCriteriaActive(JSON.parse(candidate))
    } catch {
      // Try the next encoding of the same cookie.
    }
  }

  return true
}
