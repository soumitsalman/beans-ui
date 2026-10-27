<script setup lang="ts">
import SignInPrompt from '~/components/account/SignInPrompt.vue'
import type { ContinuationAccess } from '#shared/continuation'

const props = defineProps<{ access?: ContinuationAccess, can_load_more: boolean, loading: boolean, visible_count?: number }>()
const emit = defineEmits<{ more: [], renew: [] }>()
const { action_blocked } = useActionCooldown()
const { session } = useAccount()
const requires_signin = computed(() => props.access?.state === 'sign_in_required' && !session.value.signed_in)
</script>

<template>
  <span
    v-if="visible_count !== undefined"
    role="status"
    aria-live="polite"
    class="sr-only"
  >{{ visible_count }} items shown.</span>
  <SignInPrompt v-if="requires_signin && can_load_more" />
  <div
    v-else-if="can_load_more"
    class="flex justify-center pt-2"
    aria-live="polite"
  >
    <UButton
      v-if="access?.state === 'retryable_error'"
      label="Retry continuation access"
      color="neutral"
      variant="outline"
      :loading="loading"
      :disabled="loading || action_blocked"
      @click="emit('renew')"
    />
    <UButton
      v-else
      label="More"
      color="neutral"
      variant="outline"
      :loading="loading"
      :disabled="loading || action_blocked"
      @click="emit('more')"
    />
  </div>
</template>
