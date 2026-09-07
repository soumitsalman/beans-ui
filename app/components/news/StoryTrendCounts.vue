<script setup lang="ts">
import { computed } from 'vue'
import type { NewsTrend } from '~/types/news'
import { trendSocialCounts } from '~/utils/trend'

interface StoryTrendCountsProps {
  trend?: NewsTrend | null
}

const props = defineProps<StoryTrendCountsProps>()

const social_counts = computed(() => trendSocialCounts(props.trend))
</script>

<template>
  <div
    v-if="social_counts.length"
    class="flex flex-nowrap items-center justify-end gap-x-2.5 tabular-nums"
  >
    <span
      v-for="count in social_counts"
      :key="count.key"
      class="inline-flex items-center gap-1"
      :aria-label="`${count.display} ${count.label}`"
    >
      <UIcon
        :name="count.icon"
        class="size-3 text-primary"
        aria-hidden="true"
      />
      {{ count.display }}
    </span>
  </div>
</template>
