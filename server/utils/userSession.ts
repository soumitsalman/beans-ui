import type { H3Event } from 'h3'

export function sessionUser(event: H3Event): string | null {
  if (event.context.beans_auth_unavailable) return null
  const auth = event.context.auth?.({ acceptsToken: 'session_token' })
  const expires_at = auth?.sessionClaims?.exp
  if (expires_at && expires_at * 1000 <= Date.now()) return null
  return auth?.isAuthenticated && auth.userId ? auth.userId : null
}
export function requireSessionUser(event: H3Event): string {
  if (event.context.beans_auth_unavailable) throw createError({ statusCode: 503, statusMessage: 'Sign-in is temporarily unavailable. Public reading remains available.' })
  const owner_id = sessionUser(event)
  if (!owner_id) throw createError({ statusCode: 401, statusMessage: 'Sign in again to continue. Your changes have not been saved.' })
  return owner_id
}
export function requireSameOrigin(event: H3Event): void {
  const origin = getHeader(event, 'origin')
  const request_origin = getRequestURL(event).origin
  if (!origin || origin !== request_origin || getHeader(event, 'sec-fetch-site') === 'cross-site') {
    throw createError({ statusCode: 403, statusMessage: 'Open this action from Beans.' })
  }
}
