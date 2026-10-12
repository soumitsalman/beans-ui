import { computed, onScopeDispose, ref, watch } from 'vue'

export function useActionCooldown() {
  const cooldown_until = useState<number>('beans-action-cooldown', () => 0)
  const now = ref(Date.now())
  let _timer: ReturnType<typeof setInterval> | undefined
  const remaining_seconds = computed(() => Math.max(0, Math.ceil((cooldown_until.value - now.value) / 1000)))
  const action_blocked = computed(() => remaining_seconds.value > 0)
  const cooldown_message = computed(() => action_blocked.value ? `Too many requests. Try again in ${remaining_seconds.value} seconds.` : '')

  function stopTimer(): void {
    clearInterval(_timer)
    _timer = undefined
  }

  watch(cooldown_until, () => {
    now.value = Date.now()
    stopTimer()
    if (import.meta.client && cooldown_until.value > now.value) {
      _timer = setInterval(() => {
        now.value = Date.now()
        if (!action_blocked.value) stopTimer()
      }, 250)
    }
  }, { immediate: true, flush: 'sync' })
  onScopeDispose(stopTimer)

  function startCooldown(seconds: number): void {
    cooldown_until.value = Math.max(cooldown_until.value, Date.now() + seconds * 1000)
  }

  return { action_blocked, cooldown_message, remaining_seconds, startCooldown }
}
