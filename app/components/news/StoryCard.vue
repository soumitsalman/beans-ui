<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsStory } from '~/types/news'
import StorySourceStack from '~/components/news/StorySourceStack.vue'
import { formatCount, formatFriendlyTime, formatTaxonomyLabel } from '~/utils/formatters'
import { sourceLabel } from '~/utils/source'

type StoryCardMode = 'compressed' | 'snapshot' | 'detailed'

interface StoryCardProps {
  story: NewsStory
  mode: StoryCardMode
}

const props = defineProps<StoryCardProps>()

const image_failed = ref(false)
const story_url = computed(() => `/story/${props.story.id}`)
const primary_category = computed(() => props.story.categories[0])
const regions = computed(() => props.story.regions.slice(0, 2))
const entities = computed(() => props.story.entities.slice(0, 2))
const primary_entity = computed(() => props.story.entities[0])
const published_label = computed(() => formatFriendlyTime(
  props.story.last_published_at || props.story.published_at
))
const show_story_image = computed(() => Boolean(props.story.image_url) && !image_failed.value)
const show_summary = computed(() => props.mode !== 'compressed' && Boolean(props.story.summary))
const show_detailed_metadata = computed(() => props.mode === 'detailed')
const source_label = computed(() => sourceLabel(props.story.top_articles?.[0]) || sourceLabel({ source: props.story.source }))
const trend_score = computed(() => props.story.trend?.trend_score)
const trend_icon = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'lucide:flame'
  if (trend_score.value >= 1000) return 'lucide:trending-up'
  return 'lucide:activity'
})
const has_trend = computed(() => Boolean(
  props.story.trend?.trend_score
  || props.story.trend?.mentions
  || props.story.trend?.likes
  || props.story.trend?.comments
))

watch(() => props.story.image_url, () => {
  image_failed.value = false
})
</script>

<template>
  <NuxtLink
    :to="story_url"
    :aria-label="`Open ${story.title}`"
    :class="[
      'group relative flex w-full overflow-hidden rounded-lg border border-stone-800/90 bg-stone-900/60 transition-colors duration-150 hover:border-stone-700 hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
      mode === 'compressed' ? 'gap-3 p-3' : 'gap-4 p-3.5',
      mode === 'detailed' ? 'sm:p-4' : ''
    ]"
  >
    <div
      v-if="show_story_image"
      class="relative shrink-0 overflow-hidden rounded-md bg-stone-800"
      :class="mode === 'compressed' ? 'size-20' : 'size-24 sm:size-28'"
    >
      <img
        :src="story.image_url"
        :alt="story.title"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="eager"
        referrerpolicy="no-referrer"
        @error="image_failed = true"
      >
    </div>

    <div class="min-w-0 flex-1">
      <div class="mb-2 flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <StorySourceStack :story="story" />
          <span
            v-if="source_label"
            class="truncate text-[11px] font-medium text-stone-500"
          >
            {{ source_label }}
          </span>
        </div>
        <time
          v-if="published_label"
          class="shrink-0 text-[11px] tabular-nums text-stone-600"
          :datetime="story.last_published_at || story.published_at"
        >
          {{ published_label }}
        </time>
      </div>

      <h3
        class="font-semibold leading-snug text-stone-100 transition-colors group-hover:text-amber-100"
        :class="mode === 'compressed' ? 'line-clamp-3 text-sm' : 'line-clamp-3 text-[15px] sm:text-base'"
      >
        {{ story.title }}
      </h3>

      <p
        v-if="show_summary"
        class="mt-2 text-sm leading-5 text-stone-400"
        :class="mode === 'snapshot' ? 'line-clamp-2' : 'line-clamp-3'"
      >
        {{ story.summary }}
      </p>

      <div class="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-stone-500">
        <span
          v-if="primary_category"
          class="inline-flex min-w-0 items-center gap-1.5"
        >
          <UIcon
            name="lucide:tag"
            class="size-3 shrink-0 text-amber-500/80"
            aria-hidden="true"
          />
          <span class="max-w-36 truncate">{{ formatTaxonomyLabel(primary_category) }}</span>
        </span>
        <span
          v-for="region in regions"
          :key="`region-${region}`"
          class="inline-flex min-w-0 items-center gap-1.5"
        >
          <UIcon
            name="lucide:map-pin"
            class="size-3 shrink-0 text-stone-600"
            aria-hidden="true"
          />
          <span class="max-w-28 truncate">{{ formatTaxonomyLabel(region) }}</span>
        </span>
        <span
          v-for="entity in entities"
          :key="`entity-${entity}`"
          class="inline-flex min-w-0 items-center gap-1.5"
        >
          <UIcon
            name="lucide:landmark"
            class="size-3 shrink-0 text-stone-600"
            aria-hidden="true"
          />
          <span class="max-w-28 truncate">{{ formatTaxonomyLabel(entity) }}</span>
        </span>
        <span
          v-if="trend_icon"
          class="inline-flex items-center gap-1.5 tabular-nums"
        >
          <UIcon
            :name="trend_icon"
            class="size-3 text-amber-400"
            aria-hidden="true"
          />
          {{ formatCount(trend_score) }}
        </span>
        <span
          v-if="story.trend?.likes !== null && story.trend?.likes !== undefined"
          class="inline-flex items-center gap-1.5 tabular-nums"
        >
          <UIcon
            name="lucide:thumbs-up"
            class="size-3 text-stone-600"
            aria-hidden="true"
          />
          {{ formatCount(story.trend.likes) }}
        </span>
        <span
          v-if="story.trend?.comments !== null && story.trend?.comments !== undefined"
          class="inline-flex items-center gap-1.5 tabular-nums"
        >
          <UIcon
            name="lucide:messages-square"
            class="size-3 text-stone-600"
            aria-hidden="true"
          />
          {{ formatCount(story.trend.comments) }}
        </span>
        <span
          v-if="story.trend?.mentions !== null && story.trend?.mentions !== undefined"
          class="inline-flex items-center gap-1.5 tabular-nums"
        >
          <UIcon
            name="lucide:message-circle"
            class="size-3 text-stone-600"
            aria-hidden="true"
          />
          {{ formatCount(story.trend.mentions) }}
        </span>
        <span
          v-if="story.trend?.shares !== null && story.trend?.shares !== undefined"
          class="inline-flex items-center gap-1.5 tabular-nums"
        >
          <UIcon
            name="lucide:share-2"
            class="size-3 text-stone-600"
            aria-hidden="true"
          />
          {{ formatCount(story.trend.shares) }}
        </span>
      </div>

      <div
        v-if="show_detailed_metadata"
        class="mt-3 flex flex-wrap items-center gap-1.5 border-t border-stone-800/80 pt-3"
      >
        <UBadge
          v-if="primary_entity"
          color="neutral"
          variant="soft"
          size="sm"
          class="max-w-40 truncate bg-stone-800 text-stone-300"
        >
          {{ formatTaxonomyLabel(primary_entity) }}
        </UBadge>
        <UBadge
          v-if="has_trend && story.trend?.trend_score"
          color="warning"
          variant="soft"
          size="sm"
          class="bg-amber-500/10 text-amber-300"
        >
          {{ formatCount(story.trend?.trend_score) }} score
        </UBadge>
        <span
          v-if="story.trend?.likes"
          class="inline-flex items-center gap-1 text-[11px] tabular-nums text-stone-500"
        >
          <UIcon
            name="lucide:thumbs-up"
            class="size-3"
            aria-hidden="true"
          />
          {{ formatCount(story.trend?.likes) }}
        </span>
        <span
          v-if="story.trend?.comments"
          class="inline-flex items-center gap-1 text-[11px] tabular-nums text-stone-500"
        >
          <UIcon
            name="lucide:messages-square"
            class="size-3"
            aria-hidden="true"
          />
          {{ formatCount(story.trend?.comments) }}
        </span>
      </div>
    </div>

    <UIcon
      v-if="mode === 'detailed'"
      name="lucide:arrow-up-right"
      class="absolute right-3 top-3 size-4 text-stone-600 transition-colors group-hover:text-amber-400"
      aria-hidden="true"
    />
  </NuxtLink>
</template>
