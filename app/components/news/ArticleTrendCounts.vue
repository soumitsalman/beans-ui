<script setup lang="ts">
import { computed } from 'vue'
import type { NewsTrend } from '~/types/news'
import { formatCount } from '~/utils/formatters'
import { hasPositiveCount } from '~/utils/trend'

const props = defineProps<{ trend?: NewsTrend | null }>()

const counts = computed(() => [
  { key: 'mentions', icon: 'lucide:message-circle', value: props.trend?.mentions },
  { key: 'comments', icon: 'lucide:messages-square', value: props.trend?.comments },
  { key: 'likes', icon: 'lucide:thumbs-up', value: props.trend?.likes }
].filter(item => hasPositiveCount(item.value)))
</script>

<template>
  <div
    v-if="counts.length"
    class="flex flex-nowrap items-center justify-end gap-x-2.5 tabular-nums"
  >
    <span
      v-for="count in counts"
      :key="count.key"
      class="inline-flex items-center gap-1"
      :aria-label="`${formatCount(count.value)} ${count.key}`"
    >
      <UIcon
        :name="count.icon"
        class="size-3 text-primary"
        aria-hidden="true"
      />
      {{ formatCount(count.value) }}
    </span>
  </div>
</template>
