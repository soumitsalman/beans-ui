import { CLIENT_ACTION_TIMEOUT_MS } from '#shared/actionTiming.js'
import { resourceError, retryAfterSeconds } from '~/utils/resourceError'

export function useBeansActions() {
  const event = import.meta.server ? useRequestEvent() : undefined
  const { action_blocked, remaining_seconds, startCooldown } = useActionCooldown()
  async function executeAction<T>(action: string, payload: unknown = {}): Promise<T> {
    if (import.meta.server) {
      const execute = event?.context.beans_action as ((action: string, payload: unknown) => Promise<T>) | undefined
      if (!execute) throw createError({ statusCode: 503, statusMessage: 'Request protection is temporarily unavailable.' })
      return execute(action, payload)
    }
    if (action_blocked.value) throw createError({ statusCode: 429, data: { retry_after: remaining_seconds.value } })
    try {
      return await $fetch<T>(`/api/actions/${action}`, {
        method: 'POST', body: payload as Record<string, unknown>, retry: 0, timeout: CLIENT_ACTION_TIMEOUT_MS
      }) as T
    } catch (error) {
      if (resourceError(error).statusCode === 429) startCooldown(retryAfterSeconds(error))
      throw error
    }
  }
  return { executeAction }
}
