import { z } from 'zod'
import { enforceRateLimit } from '../../utils/rateLimit'
import { continuationState, readContinuation } from '../../utils/continuationAccess'
import { requireSameOrigin } from '../../utils/userSession'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  requireSameOrigin(event)
  await enforceRateLimit(event)
  const input = z.object({ token: z.string().max(64_000) }).strict().safeParse(await readBody(event))
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Invalid continuation.' })
  const payload = readContinuation(event, input.data.token, undefined, undefined, true)
  if (payload.signed_in && !event.context.auth?.({ acceptsToken: 'session_token' }).userId) return { state: 'sign_in_required', token: input.data.token }
  return continuationState(event, payload, payload.cursor)
})
