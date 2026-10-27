import { randomBytes } from 'node:crypto'
import { getRequestIP, type H3Event } from 'h3'
import { ANONYMOUS_COOKIE, COOKIE_LIFETIME_SECONDS, hashIdentity, newIdentity, normaliseIp, signIdentity, verifyIdentity } from './anonymousIdentity'
import { consumeQuota, IP_LIMIT, USER_LIMIT } from './rateLimitStore'

const DEV_SECRET = randomBytes(32).toString('hex')

export async function enforceRateLimit(event: H3Event): Promise<void> {
  setHeader(event, 'cache-control', 'private, no-store')
  const config = useRuntimeConfig(event)
  const secret = config.rate_limit_cookie_secret || (import.meta.dev ? DEV_SECRET : '')
  const failUnavailable = () => {
    setHeader(event, 'retry-after', 5)
    throw createError({ statusCode: 503, statusMessage: 'Request protection is temporarily unavailable. Please retry.' })
  }
  if (secret.length < 32) return failUnavailable()
  // Trust Fly's header only when configured for a deployment reached through Fly Proxy.
  const ip = String(config.rate_limit_trust_fly) === 'true'
    ? normaliseIp(getHeader(event, 'fly-client-ip'))
    : normaliseIp(getRequestIP(event, { xForwardedFor: import.meta.dev }))
  if (!ip) return failUnavailable()
  const verified_id = verifyIdentity(getCookie(event, ANONYMOUS_COOKIE), secret)
  const id = verified_id ?? newIdentity()
  const key = (kind: string, value: string) => `beans:{actions}:${kind}:${hashIdentity(value, secret)}`
  event.context.beans_anonymous_id = id
  event.context.beans_identity_expiry = verified_id ? Number(getCookie(event, ANONYMOUS_COOKIE)!.split('.')[1]) + COOKIE_LIFETIME_SECONDS * 1000 : Date.now() + COOKIE_LIFETIME_SECONDS * 1000
  event.context.beans_protection_secret = secret
  const signed_in_id = event.context.auth?.({ acceptsToken: 'session_token' })?.userId
  const keys = [key(signed_in_id ? 'user' : 'browser', signed_in_id || id), key('ip', ip)]
  const limits = [USER_LIMIT, IP_LIMIT]
  // A client refusing/forging cookies cannot get ten new requests with every ID.
  if (!verified_id) {
    keys.push(key('anonymous-ip', ip))
    limits.push(USER_LIMIT)
  }
  let result
  try {
    result = await consumeQuota(keys, limits, config.rate_limit_redis_url)
  } catch {
    return failUnavailable()
  }
  setHeader(event, 'x-ratelimit-limit', String(USER_LIMIT))
  setHeader(event, 'x-ratelimit-remaining', String(result.remaining))
  if (!result.allowed) {
    setHeader(event, 'retry-after', result.retry_after)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests—try again shortly.', data: { retry_after: result.retry_after } })
  }
  if (!verified_id) {
    setCookie(event, ANONYMOUS_COOKIE, signIdentity(id, Date.now(), secret), {
      httpOnly: true, secure: !import.meta.dev, sameSite: 'lax', path: '/', maxAge: COOKIE_LIFETIME_SECONDS
    })
  }
}
