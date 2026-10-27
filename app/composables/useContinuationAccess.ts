import type { ContinuationAccess } from '#shared/continuation'

export function useContinuationAccess() {
  const access = ref<ContinuationAccess | undefined>()
  const { session, generation } = useAccount()
  const { startCooldown } = useActionCooldown()
  const pending = ref(false)
  function updateAccess(value?: ContinuationAccess) {
    access.value = value
  }
  async function renewAccess(): Promise<void> {
    if (!access.value?.token || pending.value)
      return
    pending.value = true
    const current = generation.value
    try {
      const result = await $fetch<ContinuationAccess>('/api/account/continuation', { method: 'POST', body: { token: access.value.token }, retry: 0, timeout: 10000 })
      if (generation.value === current)
        access.value = result
    } catch (error) {
      const response = error as {
        data?: {
          statusCode?: number
          data?: {
            retry_after?: number
          }
        }
      }
      if (response.data?.statusCode === 429)
        startCooldown(response.data.data?.retry_after ?? 5)
      if (generation.value === current && access.value)
        access.value = { ...access.value, state: 'retryable_error' }
    } finally {
      pending.value = false
    }
  }
  async function canContinue(): Promise<boolean> {
    if (!access.value || pending.value)
      return false
    if (access.value.state === 'sign_in_required' && !session.value.signed_in)
      return false
    if ((access.value.expires_at ?? 0) <= Date.now() || (session.value.signed_in && access.value.state !== 'authenticated_available'))
      await renewAccess()
    return access.value?.state === 'available' || access.value?.state === 'authenticated_available'
  }
  async function handleFailure(error: unknown): Promise<void> {
    const response = error as {
      data?: {
        data?: {
          code?: string
        }
      }
    }
    const code = response.data?.data?.code
    if (code === 'sign_in_required' && access.value)
      access.value = { ...access.value, state: 'sign_in_required' }
    else if (code === 'continuation_expired')
      await renewAccess()
  }
  watch(() => session.value.signed_in, () => {
    if (access.value?.token)
      void renewAccess()
  })
  return { access, pending, updateAccess, renewAccess, canContinue, handleFailure }
}
