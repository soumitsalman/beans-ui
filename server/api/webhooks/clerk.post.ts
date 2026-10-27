import { verifyWebhook } from '@clerk/nuxt/webhooks'
import { createPreferenceRepository } from '../../database/repository'
import { getUserDatabase } from '../../utils/userDatabase'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  let message
  try {
    message = await verifyWebhook(event as unknown as Parameters<typeof verifyWebhook>[0])
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature.' })
  }
  if (message.type === 'user.deleted' && message.data.id) {
    try {
      const repository = createPreferenceRepository(getUserDatabase())
      const event_id = getHeader(event, 'svix-id') || message.data.id
      await repository.queueCleanup(message.data.id, event_id)
      await repository.cleanupAccount(message.data.id, event_id)
    } catch {
      throw createError({ statusCode: 503, statusMessage: 'Account cleanup is pending. Retry delivery.' })
    }
  }
  return { received: true }
})
