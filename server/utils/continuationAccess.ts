import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { ContinuationAccess, ContinuationContext } from '../../shared/continuation'
import { createContinuationRepository } from '../database/continuationRepository'
import { getUserDatabase } from './userDatabase'
import { sessionUser } from './userSession'

interface ContinuationToken extends ContinuationContext {
  identity: string
  cursor: string
  issued_at: number
  expires_at: number
  signed_in: boolean
  owner_hash?: string
}
const TOKEN_LIFETIME_MS = 30 * 60000
export function signContinuation(payload: ContinuationToken, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`
}
export function verifyContinuation(token: string, secret: string): ContinuationToken | null {
  if (typeof token !== 'string' || token.length > 64000)
    return null
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra)
    return null
  const expected = createHmac('sha256', secret).update(encoded).digest()
  const received = Buffer.from(signature, 'base64url')
  if (received.length !== expected.length || !timingSafeEqual(received, expected))
    return null
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString()) as ContinuationToken
  } catch {
    return null
  }
}
function identityHash(event: H3Event): string {
  if (!event.context.beans_anonymous_id || !event.context.beans_protection_secret)
    throw createError({ statusCode: 503, statusMessage: 'Continuation protection is unavailable. Please retry.' })
  return createHmac('sha256', event.context.beans_protection_secret).update(event.context.beans_anonymous_id).digest('hex')
}
function contextHash(event: H3Event, context: ContinuationContext): string {
  return createHmac('sha256', event.context.beans_protection_secret).update(JSON.stringify([identityHash(event), context.surface, context.context])).digest('hex')
}
export function readContinuation(event: H3Event, token: string | undefined, cursor?: string | null, surface?: string, allow_public_owner_change = false): ContinuationToken {
  const payload = token ? verifyContinuation(token, event.context.beans_protection_secret || '') : null
  if (!payload || payload.identity !== identityHash(event) || (cursor && payload.cursor !== cursor) || (surface && payload.surface !== surface)) {
    throw createError({ statusCode: 400, statusMessage: 'This continuation is invalid. Refresh this page to continue.' })
  }
  const owner_id = sessionUser(event)
  if (payload.signed_in && owner_id && payload.owner_hash !== createHmac('sha256', event.context.beans_protection_secret).update(owner_id).digest('hex') && (!allow_public_owner_change || payload.criteria.personalized === true)) {
    throw createError({ statusCode: 400, statusMessage: 'The account changed. Refresh this page to continue.' })
  }
  return payload
}
export async function continuationState(event: H3Event, context: ContinuationContext, cursor: string | null): Promise<ContinuationAccess> {
  if (!cursor)
    return { state: 'exhausted' }
  const signed_in = Boolean(sessionUser(event))
  const payload: ContinuationToken = { ...context, identity: identityHash(event), cursor, issued_at: Date.now(), expires_at: Date.now() + TOKEN_LIFETIME_MS, signed_in, owner_hash: signed_in ? createHmac('sha256', event.context.beans_protection_secret).update(sessionUser(event)!).digest('hex') : undefined }
  const token = signContinuation(payload, event.context.beans_protection_secret)
  if (signed_in)
    return { state: 'authenticated_available', token, expires_at: payload.expires_at }
  try {
    const status = await createContinuationRepository(getUserDatabase()).status(contextHash(event, context))
    return { state: status === 'consumed' ? 'sign_in_required' : 'available', token, expires_at: payload.expires_at }
  } catch {
    return { state: 'retryable_error', token, expires_at: payload.expires_at }
  }
}
export async function withContinuation<T>(event: H3Event, context: ContinuationContext, cursor: string | null | undefined, token: string | undefined, execute: () => Promise<T>): Promise<T> {
  if (!cursor)
    return execute()
  const payload = readContinuation(event, token, cursor, context.surface)
  if (payload.context !== context.context || JSON.stringify(payload.criteria) !== JSON.stringify(context.criteria)) {
    throw createError({ statusCode: 400, statusMessage: 'The page filters changed. Refresh this page to continue.' })
  }
  if (payload.expires_at < Date.now())
    throw createError({ statusCode: 409, statusMessage: 'Renew continuation access and try More again.', data: { code: 'continuation_expired' } })
  if (sessionUser(event))
    return execute()
  if (payload.signed_in)
    throw createError({ statusCode: 401, statusMessage: 'Sign in again to load more content.', data: { code: 'sign_in_required' } })
  let repository
  let reservation_id
  const hash = contextHash(event, context)
  try {
    repository = createContinuationRepository(getUserDatabase())
    reservation_id = await repository.reserve(hash, new Date(event.context.beans_identity_expiry).toISOString())
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Continuation protection is unavailable. Your allowance was not used. Please retry.' })
  }
  if (!reservation_id) {
    const status = await repository.status(hash)
    throw createError({ statusCode: status === 'consumed' ? 403 : 409, statusMessage: status === 'consumed' ? 'Sign in for more content.' : 'Another More request is in progress. Please retry.', data: { code: status === 'consumed' ? 'sign_in_required' : 'continuation_busy' } })
  }
  try {
    const result = await execute()
    if (!await repository.complete(hash, reservation_id))
      throw createError({ statusCode: 409, statusMessage: 'This request expired. Please retry.' })
    return result
  } catch (error) {
    await repository.release(hash, reservation_id).catch(() => { })
    throw error
  }
}
