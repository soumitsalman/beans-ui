<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import { formatCount, formatFriendlyTime } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

interface StoryTimelineProps {
  propagation_articles: NewsArticle[]
  coverage_articles: NewsArticle[]
  loading_propagation: boolean
  loading_coverage: boolean
  first_published_at?: string | null
  last_published_at?: string | null
  article_count?: number | null
  coverage_error?: string | null
  propagation_error?: string | null
}

interface PropagationItem {
  articles: NewsArticle[]
  date: string
}

interface CoverageEngagement {
  mentions?: string
  likes?: string
  comments?: string
  shares?: string
}

interface CoverageRow {
  article: NewsArticle
  source_label?: string
  favicon?: string
  engagement: CoverageEngagement
}

const props = defineProps<StoryTimelineProps>()

const emit = defineEmits<{
  'retry-coverage': []
  'retry-propagation': []
}>()

const MAX_PROPAGATION_POINTS = 5
const MIDDLE_PROPAGATION_GROUPS = 3

const sorted_propagation_articles = computed(() => {
  return [...props.propagation_articles].sort((left, right) => {
    const left_time = propagationTime(left.published_at)
    const right_time = propagationTime(right.published_at)
    return left_time - right_time
  })
})

const timeline_items = computed<PropagationItem[]>(() => {
  const articles = sorted_propagation_articles.value
  if (articles.length <= MAX_PROPAGATION_POINTS) {
    return articles.map((article, index) => ({
      articles: [article],
      date: formatTimelineDate(article.published_at, index, articles.length)
    }))
  }

  const first_article = articles[0]
  const last_article = articles[articles.length - 1]
  if (!first_article || !last_article) return []

  const middle_articles = articles.slice(1, -1)
  const middle_groups = Array.from({ length: MIDDLE_PROPAGATION_GROUPS }, () => [] as NewsArticle[])

  middle_articles.forEach((article, index) => {
    const group_index = Math.min(
      middle_groups.length - 1,
      Math.floor(index * middle_groups.length / middle_articles.length)
    )
    middle_groups[group_index]?.push(article)
  })

  return [
    [first_article],
    ...middle_groups,
    [last_article]
  ].map((group, index) => ({
    articles: group,
    date: formatPropagationDateRange(group, index, MAX_PROPAGATION_POINTS)
  }))
})

const coverage_article_count_label = computed(() => {
  return hasPositiveCount(props.article_count)
    ? formatCount(props.article_count)
    : ''
})

const coverage_rows = computed<CoverageRow[]>(() => {
  return props.coverage_articles.map(article => ({
    article,
    source_label: sourceLabel(article),
    favicon: sourceFavicon(article),
    engagement: coverageEngagement(article)
  }))
})

function hasPositiveCount(value?: number | null): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0
}

function coverageEngagement(article: NewsArticle): CoverageEngagement {
  const trend = article.trend

  return {
    mentions: hasPositiveCount(trend?.mentions) ? formatCount(trend?.mentions) : undefined,
    likes: hasPositiveCount(trend?.likes) ? formatCount(trend?.likes) : undefined,
    comments: hasPositiveCount(trend?.comments) ? formatCount(trend?.comments) : undefined,
    shares: hasPositiveCount(trend?.shares) ? formatCount(trend?.shares) : undefined
  }
}

function hasCoverageSocialCounts(engagement: CoverageEngagement): boolean {
  return Boolean(engagement.likes || engagement.comments || engagement.shares)
}

function propagationTime(value?: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY

  const date_value = new Date(value).getTime()
  return Number.isNaN(date_value) ? Number.POSITIVE_INFINITY : date_value
}

function formatPropagationDateRange(articles: NewsArticle[], index: number, total: number): string {
  const first_date = formatFriendlyTime(
    index === 0 ? props.first_published_at || articles[0]?.published_at : articles[0]?.published_at
  )
  const last_date = formatFriendlyTime(
    index === total - 1 ? props.last_published_at || articles[articles.length - 1]?.published_at : articles[articles.length - 1]?.published_at
  )

  if (!first_date || first_date === last_date) return first_date || last_date
  return `${first_date} – ${last_date}`
}

function formatTimelineDate(value: string | null | undefined, index: number, total: number): string {
  const boundary_value = index === 0
    ? props.first_published_at || value
    : index === total - 1
      ? props.last_published_at || value
      : value

  return formatFriendlyTime(boundary_value)
}
</script>

<template>
  <div class="space-y-6">
    <section
      v-if="timeline_items.length || loading_propagation || propagation_error"
      class="space-y-3"
    >
      <div class="flex items-center gap-2 px-1">
        <UIcon
          name="lucide:git-fork"
          class="size-4 text-amber-400"
          aria-hidden="true"
        />
        <h2 class="text-sm font-semibold text-stone-100">
          Propagation
        </h2>
        <UIcon
          v-if="loading_propagation && timeline_items.length"
          name="lucide:loader-circle"
          class="size-3.5 animate-spin text-stone-500"
          aria-label="Loading remaining propagation"
        />
      </div>

      <UAlert
        v-if="propagation_error"
        color="warning"
        variant="subtle"
        icon="lucide:triangle-alert"
        :title="propagation_error"
      >
        <template #actions>
          <UButton
            label="Retry"
            color="warning"
            variant="outline"
            size="xs"
            :loading="loading_propagation"
            @click="emit('retry-propagation')"
          />
        </template>
      </UAlert>

      <div
        v-if="timeline_items.length"
        class="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        <UTimeline
          :items="timeline_items"
          orientation="horizontal"
          color="neutral"
          size="sm"
          :ui="{
            root: 'min-w-max',
            item: 'w-52',
            date: 'text-[10px] tabular-nums text-stone-600',
            title: 'hidden',
            description: 'hidden',
            indicator: 'ring-1 ring-stone-800'
          }"
        >
          <template #indicator="{ item }">
            <UAvatarGroup
              v-if="item.articles.length > 1"
              :max="5"
              size="sm"
              :ui="{ base: 'ring-stone-950/95' }"
            >
              <UAvatar
                v-for="article in item.articles"
                :key="article.id"
                :src="sourceFavicon(article)"
                alt="Source"
                :icon="DEFAULT_SOURCE_ICON"
                loading="eager"
                referrerpolicy="no-referrer"
              />
            </UAvatarGroup>
            <UAvatar
              v-else
              :src="sourceFavicon(item.articles[0])"
              alt="Source"
              :icon="DEFAULT_SOURCE_ICON"
              loading="eager"
              referrerpolicy="no-referrer"
            />
          </template>
          <template #wrapper="{ item }">
            <div
              v-if="item.date"
              class="text-[10px] tabular-nums text-stone-600"
            >
              {{ item.date }}
            </div>
          </template>
        </UTimeline>
      </div>
      <div
        v-else-if="loading_propagation"
        class="flex gap-3 overflow-hidden"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-16 w-32 shrink-0 rounded-lg bg-stone-800"
        />
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex items-center gap-2 px-1">
        <UIcon
          name="lucide:newspaper"
          class="size-4 text-amber-400"
          aria-hidden="true"
        />
        <h2 class="text-sm font-semibold text-stone-100">
          Coverage
        </h2>
        <span
          v-if="coverage_article_count_label"
          class="text-xs tabular-nums text-stone-500"
        >
          {{ coverage_article_count_label }}
        </span>
      </div>

      <UAlert
        v-if="coverage_error"
        color="warning"
        variant="subtle"
        icon="lucide:triangle-alert"
        :title="coverage_error"
      >
        <template #actions>
          <UButton
            label="Retry"
            color="warning"
            variant="outline"
            size="xs"
            :loading="loading_coverage"
            @click="emit('retry-coverage')"
          />
        </template>
      </UAlert>

      <div
        v-if="loading_coverage && !coverage_articles.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-16 w-full rounded-lg bg-stone-800"
        />
      </div>

      <div
        v-else-if="coverage_rows.length"
        class="divide-y divide-stone-800/80 rounded-lg border border-stone-800/90 bg-stone-900/50 px-3"
      >
        <component
          :is="row.article.url ? 'a' : 'div'"
          v-for="row in coverage_rows"
          :key="row.article.id"
          :href="row.article.url || undefined"
          :target="row.article.url ? '_blank' : undefined"
          :rel="row.article.url ? 'noopener noreferrer' : undefined"
          :class="[
            'group flex gap-2.5 py-3 transition-colors',
            row.article.url ? 'hover:bg-stone-800/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400' : 'cursor-default'
          ]"
          :aria-label="row.article.url ? (row.article.title ? `Open ${row.article.title}` : 'Open article') : undefined"
        >
          <UAvatar
            :src="row.favicon"
            :alt="row.source_label || 'Source'"
            :icon="DEFAULT_SOURCE_ICON"
            size="xs"
            class="mt-0.5 shrink-0 ring-1 ring-stone-800/80"
            loading="eager"
            referrerpolicy="no-referrer"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-3 text-[11px] text-stone-500">
              <div class="flex min-w-0 items-center gap-2">
                <p
                  v-if="row.source_label"
                  class="min-w-0 truncate font-medium"
                >
                  {{ row.source_label }}
                </p>
                <span
                  v-if="row.engagement.mentions"
                  class="inline-flex shrink-0 items-center gap-1 tabular-nums"
                >
                  <UIcon
                    name="lucide:message-circle"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ row.engagement.mentions }} mentions
                </span>
              </div>
              <div
                v-if="hasCoverageSocialCounts(row.engagement)"
                class="flex shrink-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-1 tabular-nums"
              >
                <span
                  v-if="row.engagement.likes"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="lucide:thumbs-up"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ row.engagement.likes }}
                </span>
                <span
                  v-if="row.engagement.comments"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="lucide:messages-square"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ row.engagement.comments }}
                </span>
                <span
                  v-if="row.engagement.shares"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="lucide:share-2"
                    class="size-3"
                    aria-hidden="true"
                  />
                  {{ row.engagement.shares }}
                </span>
              </div>
            </div>
            <div class="mt-1 flex items-start gap-3">
              <h3
                v-if="row.article.title"
                class="line-clamp-2 flex-1 text-sm font-medium leading-5 text-stone-200 group-hover:text-amber-100"
              >
                {{ row.article.title }}
              </h3>
              <UIcon
                v-if="row.article.url"
                name="lucide:arrow-up-right"
                class="mt-0.5 size-4 shrink-0 text-stone-600 group-hover:text-amber-400"
                aria-hidden="true"
              />
            </div>
          </div>
        </component>
      </div>

      <div
        v-else-if="!loading_coverage && !coverage_error"
        class="flex h-20 items-center justify-center rounded-lg border border-dashed border-stone-800 text-sm text-stone-600"
      >
        <UIcon
          name="lucide:file-question"
          class="size-5"
          aria-hidden="true"
        />
        <span class="ml-2">No coverage is available.</span>
      </div>
    </section>
  </div>
</template>
