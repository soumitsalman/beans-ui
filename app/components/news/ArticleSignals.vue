<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import StoryConfidenceBadge from '~/components/news/StoryConfidenceBadge.vue'

const props = defineProps<{ article: NewsArticle }>()

const trend_score = computed(() => props.article.trend?.trend_score)
const trend_icon = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'lucide:flame'
  if (trend_score.value >= 1000) return 'lucide:trending-up'
  return 'lucide:activity'
})
const trend_label = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'Hot'
  if (trend_score.value >= 1000) return 'Trending'
  return 'Recent activity'
})
const ideology = computed(() => {
  const value = props.article.ideology?.toLowerCase()
  return value === 'left' || value === 'right' ? value : undefined
})
const ideology_label = computed(() => ideology.value === 'left'
  ? 'Leans Left'
  : ideology.value === 'right' ? 'Leans Right' : undefined)
</script>

<template>
  <div class="flex shrink-0 items-center justify-end gap-2">
    <StoryConfidenceBadge :confidence="article.confidence" />
    <UTooltip
      v-if="ideology"
      :text="ideology_label"
    >
      <span
        role="img"
        tabindex="0"
        :aria-label="ideology_label"
        :class="[
          'inline-flex shrink-0 items-center gap-0.5 leading-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current',
          ideology === 'left' ? 'text-blue-400' : 'text-red-400'
        ]"
      >
        <UIcon
          :name="ideology === 'left' ? 'lucide:arrow-left' : 'lucide:arrow-right'"
          class="size-3.5"
          aria-hidden="true"
        />
        <span
          class="text-[10px] font-semibold"
          aria-hidden="true"
        >{{ ideology === 'left' ? 'L' : 'R' }}</span>
      </span>
    </UTooltip>
    <UTooltip
      v-if="trend_icon"
      :text="trend_label"
    >
      <span
        role="img"
        tabindex="0"
        :aria-label="trend_label"
        class="inline-flex items-center text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        <UIcon
          :name="trend_icon"
          class="size-3.5"
          aria-hidden="true"
        />
      </span>
    </UTooltip>
  </div>
</template>
