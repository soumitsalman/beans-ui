<script setup lang="ts">
import { computed, ref, resolveComponent, watch } from 'vue'
import type { NewsStory } from '~/types/news'
import MarkdownSummary from '~/components/news/MarkdownSummary.vue'
import StorySourceStack from '~/components/news/StorySourceStack.vue'
import StoryTrendCounts from '~/components/news/StoryTrendCounts.vue'
import { formatCount, formatFriendlyTime, formatTaxonomyLabel } from '~/utils/formatters'
import { hasResolvableSource } from '~/utils/source'
import { hasPositiveCount, trendSocialCounts } from '~/utils/trend'

type StoryCardMode = 'compressed' | 'snapshot' | 'detailed'

interface StoryCardProps {
  story: NewsStory
  mode: StoryCardMode
  linked?: boolean
}

const props = withDefaults(defineProps<StoryCardProps>(), {
  linked: true
})

const { outboundHref } = useOutboundUrl()
const image_failed = ref(false)
const story_url = computed(() => props.story.story_id
  ? `/stories/${props.story.story_id}`
  : outboundHref(props.story.url)
)
const is_external_link = computed(() => !props.story.story_id && Boolean(props.story.url))
const is_linked = computed(() => props.linked && Boolean(story_url.value))
const card_component = computed(() => is_linked.value ? resolveComponent('NuxtLink') : 'div')
const primary_category = computed(() => props.story.categories.find(Boolean))
const metadata_limit = computed(() => props.mode === 'detailed' ? 3 : 2)
const regions = computed(() => props.story.regions.filter(Boolean).slice(0, metadata_limit.value))
const entities = computed(() => props.story.entities.filter(Boolean).slice(0, metadata_limit.value))
const show_taxonomy = computed(() => Boolean(regions.value.length || entities.value.length))
const published_label = computed(() => formatFriendlyTime(
  props.story.last_published_at || props.story.published_at
))
const show_story_image = computed(() => Boolean(props.story.image_url) && !image_failed.value)
const show_summary = computed(() => props.mode !== 'compressed' && Boolean(props.story.summary))
const trend_score = computed(() => props.story.trend?.trend_score)
const trend_icon = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'lucide:flame'
  if (trend_score.value >= 1000) return 'lucide:trending-up'
  return 'lucide:activity'
})
const trend_label = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'High trend activity'
  if (trend_score.value >= 1000) return 'Rising trend activity'
  return 'Recent activity'
})
const social_counts = computed(() => trendSocialCounts(props.story.trend))
const has_source_group = computed(() => props.story.source_count > 0
  || (props.story.top_articles ?? []).some(article => hasResolvableSource(article))
  || hasResolvableSource({ source: props.story.source, url: props.story.url })
)
const article_count_display = computed(() => hasPositiveCount(props.story.article_count)
  ? formatCount(props.story.article_count)
  : undefined
)
const source_count_display = computed(() => hasPositiveCount(props.story.source_count)
  ? formatCount(props.story.source_count)
  : undefined
)
const show_story_counts = computed(() => Boolean(article_count_display.value || source_count_display.value))

watch(() => props.story.image_url, () => {
  image_failed.value = false
})
</script>

<template>
  <component
    :is="card_component"
    :to="is_linked ? story_url : undefined"
    :external="is_external_link || undefined"
    :target="is_external_link ? '_blank' : undefined"
    :rel="is_external_link ? 'noopener noreferrer' : undefined"
    :aria-label="is_linked ? (story.title ? `Open ${story.title}` : 'Open article') : undefined"
    class="group relative block w-full overflow-hidden rounded-lg border border-stone-800/90 bg-stone-900/60 transition-colors duration-150 hover:border-stone-700 hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
  >
    <template v-if="mode === 'compressed'">
      <div
        v-if="show_story_image"
        class="aspect-[16/9] w-full overflow-hidden bg-stone-800"
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
      <div class="space-y-3 p-3.5">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-stone-500">
          <span
            v-if="primary_category"
            class="max-w-40 truncate font-medium text-primary/80"
          >
            {{ formatTaxonomyLabel(primary_category) }}
          </span>
          <time
            v-if="published_label"
            class="shrink-0 tabular-nums"
            :datetime="story.last_published_at || story.published_at"
          >
            {{ published_label }}
          </time>
          <span
            v-if="trend_icon"
            class="inline-flex shrink-0 items-center text-primary"
            :aria-label="trend_label"
          >
            <UIcon
              :name="trend_icon"
              class="size-3"
              aria-hidden="true"
            />
          </span>
        </div>
        <h3
          v-if="story.title"
          class="line-clamp-3 text-base font-semibold leading-snug text-stone-100 transition-colors group-hover:text-primary"
        >
          {{ story.title }}
        </h3>
        <div
          v-if="show_taxonomy"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="region in regions"
            :key="`region-${region}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-36 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(region) }}
          </UBadge>
          <UBadge
            v-for="entity in entities"
            :key="`entity-${entity}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-36 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(entity) }}
          </UBadge>
        </div>
        <div
          v-if="has_source_group || social_counts.length"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-800/80 pt-3 text-[11px] text-stone-500"
        >
          <StorySourceStack :story="story" />
          <StoryTrendCounts
            :trend="story.trend"
            class="ml-auto"
          />
        </div>
      </div>
    </template>

    <template v-else-if="mode === 'snapshot'">
      <div class="flex gap-3.5 p-3.5">
        <div
          v-if="show_story_image"
          class="size-24 shrink-0 overflow-hidden rounded-md bg-stone-800 sm:size-28"
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
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-stone-500">
            <span
              v-if="primary_category"
              class="max-w-36 truncate font-medium text-primary/80"
            >
              {{ formatTaxonomyLabel(primary_category) }}
            </span>
            <time
              v-if="published_label"
              class="shrink-0 tabular-nums"
              :datetime="story.last_published_at || story.published_at"
            >
              {{ published_label }}
            </time>
            <span
              v-if="trend_icon"
              class="inline-flex shrink-0 items-center text-primary"
              :aria-label="trend_label"
            >
              <UIcon
                :name="trend_icon"
                class="size-3"
                aria-hidden="true"
              />
            </span>
          </div>
          <h3
            v-if="story.title"
            class="mt-1.5 line-clamp-3 text-[15px] font-semibold leading-snug text-stone-100 transition-colors group-hover:text-primary sm:text-base"
          >
            {{ story.title }}
          </h3>
          <div
            v-if="show_taxonomy"
            class="mt-2 flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="region in regions"
              :key="`region-${region}`"
              color="neutral"
              variant="soft"
              size="sm"
              class="max-w-28 truncate bg-stone-800/80 text-stone-400"
            >
              {{ formatTaxonomyLabel(region) }}
            </UBadge>
            <UBadge
              v-for="entity in entities"
              :key="`entity-${entity}`"
              color="neutral"
              variant="soft"
              size="sm"
              class="max-w-28 truncate bg-stone-800/80 text-stone-400"
            >
              {{ formatTaxonomyLabel(entity) }}
            </UBadge>
          </div>
          <MarkdownSummary
            v-if="show_summary"
            :summary="story.summary || ''"
            :line_limit="2"
            class="mt-2"
          />
        </div>
      </div>
      <div
        v-if="has_source_group || social_counts.length"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-800/80 px-3.5 py-3 text-[11px] text-stone-500"
      >
        <StorySourceStack :story="story" />
        <StoryTrendCounts
          :trend="story.trend"
          class="ml-auto"
        />
      </div>
    </template>

    <template v-else>
      <div class="space-y-4 p-4 sm:p-5">
        <div class="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-stone-500">
          <span
            v-if="primary_category"
            class="max-w-48 truncate font-medium text-primary/80"
          >
            {{ formatTaxonomyLabel(primary_category) }}
          </span>
          <time
            v-if="published_label"
            class="shrink-0 tabular-nums"
            :datetime="story.last_published_at || story.published_at"
          >
            {{ published_label }}
          </time>
          <div
            v-if="show_story_counts"
            class="ml-auto flex flex-nowrap items-center justify-end gap-x-2.5 tabular-nums"
          >
            <span
              v-if="article_count_display"
              :aria-label="`${article_count_display} ${story.article_count === 1 ? 'article' : 'articles'}`"
            >
              {{ article_count_display }} {{ story.article_count === 1 ? 'article' : 'articles' }}
            </span>
            <span
              v-if="source_count_display"
              :aria-label="`${source_count_display} ${story.source_count === 1 ? 'source' : 'sources'}`"
            >
              {{ source_count_display }} {{ story.source_count === 1 ? 'source' : 'sources' }}
            </span>
          </div>
        </div>
        <h1
          v-if="story.title"
          class="text-xl font-semibold leading-snug text-stone-100 sm:text-2xl"
        >
          {{ story.title }}
        </h1>
        <MarkdownSummary
          v-if="show_summary"
          :summary="story.summary || ''"
          :line_limit="3"
        />
        <div
          v-if="show_taxonomy"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="region in regions"
            :key="`region-${region}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(region) }}
          </UBadge>
          <UBadge
            v-for="entity in entities"
            :key="`entity-${entity}`"
            color="neutral"
            variant="soft"
            size="sm"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(entity) }}
          </UBadge>
        </div>
      </div>
    </template>
  </component>
</template>
