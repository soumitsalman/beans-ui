<script setup lang="ts">
import { computed } from 'vue'
import type { EspressoConfidence } from '~/types/news'

const props = defineProps<{
  confidence?: EspressoConfidence
}>()

const label = computed(() => {
  if (props.confidence === 'medium') return 'Moderate Confidence'
  if (props.confidence) return `${props.confidence.charAt(0).toUpperCase()}${props.confidence.slice(1)} Confidence`
  return ''
})
const color = computed(() => {
  if (props.confidence === 'high') return 'success'
  if (props.confidence === 'medium') return 'warning'
  return 'error'
})
const signal_icon = computed(() => {
  if (props.confidence === 'high') return 'lucide:signal-high'
  if (props.confidence === 'medium') return 'lucide:signal-medium'
  return 'lucide:signal-low'
})
const color_class = computed(() => `text-${color.value}`)
const tooltip = label
</script>

<template>
  <UTooltip
    v-if="label"
    :text="tooltip"
  >
    <span
      role="img"
      tabindex="0"
      :aria-label="tooltip"
      class="inline-flex shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
    >
      <UIcon
        :name="signal_icon"
        :class="['size-3.5', color_class]"
        aria-hidden="true"
      />
    </span>
  </UTooltip>
</template>
