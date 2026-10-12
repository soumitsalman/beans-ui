export function resourceError(error: unknown): { statusCode: number, statusMessage: string } {
  const failure = error as { statusCode?: number, status?: number, response?: { status?: number } } | null
  const status = failure?.statusCode || failure?.status || failure?.response?.status
  if (status === 429) return { statusCode: 429, statusMessage: 'Too many requests—try again shortly.' }
  if (status === 404 || status === 410) {
    return { statusCode: status, statusMessage: status === 410 ? 'This page is no longer available.' : 'This page was not found.' }
  }
  return { statusCode: 503, statusMessage: 'This page is temporarily unavailable. Please retry.' }
}

export function requestErrorMessage(error: unknown, fallback: string): string {
  return resourceError(error).statusCode === 429 ? 'Too many requests—try again shortly.' : fallback
}

export function retryAfterSeconds(error: unknown): number {
  const failure = error as { response?: { headers?: { get: (name: string) => string | null } }, data?: { data?: { retry_after?: number } } } | null
  const value = failure?.response?.headers?.get('retry-after')
  const seconds = value ? Number(value) : failure?.data?.data?.retry_after
  if (seconds !== undefined && Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)
  const date = value ? Date.parse(value) : NaN
  return Number.isFinite(date) ? Math.max(1, Math.ceil((date - Date.now()) / 1000)) : 60
}
