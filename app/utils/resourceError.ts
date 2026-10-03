export function resourceError(error: unknown): { statusCode: number, statusMessage: string } {
  const failure = error as { statusCode?: number, status?: number, response?: { status?: number } } | null
  const status = failure?.statusCode || failure?.status || failure?.response?.status
  if (status === 404 || status === 410) {
    return { statusCode: status, statusMessage: status === 410 ? 'This page is no longer available.' : 'This page was not found.' }
  }
  return { statusCode: 503, statusMessage: 'This page is temporarily unavailable. Please retry.' }
}
