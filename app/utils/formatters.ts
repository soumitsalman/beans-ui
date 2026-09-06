const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const THREE_DAYS_MS = 3 * DAY_MS

export function formatFriendlyTime(value?: string | null): string {
  if (!value) return ''

  const date_value = new Date(value).getTime()
  if (Number.isNaN(date_value)) return ''

  const elapsed_ms = Date.now() - date_value
  const absolute_ms = Math.abs(elapsed_ms)

  if (absolute_ms < DAY_MS) {
    const hours = Math.max(1, Math.floor(absolute_ms / HOUR_MS))
    const label = `${hours} hr${hours === 1 ? '' : 's'}`
    return elapsed_ms >= 0 ? `${label} ago` : `in ${label}`
  }

  if (absolute_ms < THREE_DAYS_MS) {
    const days = Math.max(1, Math.floor(absolute_ms / DAY_MS))
    const label = `${days} day${days === 1 ? '' : 's'}`
    return elapsed_ms >= 0 ? `${label} ago` : `in ${label}`
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date_value)
}

export function formatCount(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatTaxonomyLabel(value?: string | null): string {
  return value?.replaceAll('_', ' ').toLocaleUpperCase() || ''
}
