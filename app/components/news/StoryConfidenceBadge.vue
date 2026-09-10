<script setup lang="ts">
import { computed } from 'vue'
import type { EspressoConfidence } from '~/types/news'

const props = defineProps<{
  confidence?: EspressoConfidence
}>()

const label = computed(() => props.confidence
  ? `${props.confidence.charAt(0).toUpperCase()}${props.confidence.slice(1)}`
  : ''
)
const color = computed(() => {
  if (props.confidence === 'high') return 'success'
  if (props.confidence === 'medium') return 'warning'
  return 'error'
})
const tooltip = computed(() => label.value ? `${label.value} confidence news` : '')
</script>

<template>
  <UTooltip
    v-if="label"
    :text="tooltip"
  >
    <UBadge
      :color="color"
      variant="soft"
      size="sm"
      :aria-label="tooltip"
      class="shrink-0 rounded-full px-1.5 py-0.5 font-medium"
    >
      {{ label }}
    </UBadge>
  </UTooltip>
</template>
