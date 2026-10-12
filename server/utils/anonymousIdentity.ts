import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

export const ANONYMOUS_COOKIE = 'beans_anonymous_id'
export const COOKIE_LIFETIME_SECONDS = 30 * 86400

export function signIdentity(id: string, issued_at: number, secret: string): string {
  const payload = `${id}.${issued_at}`
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}

export function verifyIdentity(cookie: string | undefined, secret: string, now = Date.now()): string | null {
  if (!cookie || cookie.length > 150) return null
  const [id, issued_at, signature, extra] = cookie.split('.')
  if (!id || !/^[a-f0-9-]{36}$/.test(id) || !issued_at || !/^\d{13}$/.test(issued_at) || !signature || extra) return null
  const age = now - Number(issued_at)
  if (age < 0 || age >= COOKIE_LIFETIME_SECONDS * 1000) return null
  const expected = signIdentity(id, Number(issued_at), secret).split('.')[2]!
  const supplied = Buffer.from(signature)
  const actual = Buffer.from(expected)
  return supplied.length === actual.length && timingSafeEqual(supplied, actual) ? id : null
}

export function hashIdentity(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function normaliseIp(value: string | undefined): string | null {
  if (!value || !isIP(value)) return null
  const parsed = new URL(`http://${isIP(value) === 6 ? `[${value}]` : value}`).hostname.replace(/^\[|\]$/g, '')
  if (parsed.startsWith('::ffff:')) {
    const parts = parsed.slice(7).split(':')
    if (parts.length === 2) {
      const bits = (parseInt(parts[0]!, 16) * 65536 + parseInt(parts[1]!, 16)) >>> 0
      return [bits >>> 24, (bits >>> 16) & 255, (bits >>> 8) & 255, bits & 255].join('.')
    }
  }
  return parsed
}

export function newIdentity(): string {
  return randomUUID()
}
