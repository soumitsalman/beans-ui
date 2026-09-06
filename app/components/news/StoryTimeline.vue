<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

interface StoryTimelineProps {
  propagation_articles: NewsArticle[]
  coverage_articles: NewsArticle[]
  loading_propagation: boolean
  loading_coverage: boolean
  first_published_at?: string | null
  last_published_at?: string | null
  coverage_error?: string | null
  propagation_error?: string | null
}

interface PropagationItem {
  articles: NewsArticle[]
  date: string
}

const props = defineProps<StoryTimelineProps>()

const emit = defineEmits<{
  'retry-coverage': []
  'retry-propagation': []
}>()

const PROPAGATION_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
})

const sorted_propagation_articles = computed(() => {
  return [...props.propagation_articles].sort((left, right) => {
    const left_time = propagationTime(left.published_at)
    const right_time = propagationTime(right.published_at)
    return left_time - right_time
  })
})

const timeline_items = computed<PropagationItem[]>(() => {
  const articles = sorted_propagation_articles.value
  if (articles.length <= 5) {
    return articles.map((article, index) => ({
      articles: [article],
      date: formatTimelineDate(article.published_at, index, articles.length)
    }))
  }

  const first_article = articles[0]
  const last_article = articles[articles.length - 1]
  if (!first_article || !last_article) return []

  const middle_articles = articles.slice(1, -1)
  const middle_groups = Array.from({ length: 3 }, () => [] as NewsArticle[])

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
    date: formatPropagationDateRange(group, index, 5)
  }))
})

function propagationTime(value?: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY

  const date_value = new Date(value).getTime()
  return Number.isNaN(date_value) ? Number.POSITIVE_INFINITY : date_value
}

function formatPropagationDate(value?: string | null): string {
  if (!value) return ''

  const date_value = new Date(value)
  if (Number.isNaN(date_value.getTime())) return ''

  return PROPAGATION_DATE_FORMATTER.format(date_value)
}

function formatPropagationDateRange(articles: NewsArticle[], index: number, total: number): string {
  const first_date = formatPropagationDate(
    index === 0 ? props.first_published_at || articles[0]?.published_at : articles[0]?.published_at
  )
  const last_date = formatPropagationDate(
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

  return formatPropagationDate(boundary_value)
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
            title: 'line-clamp-1 text-xs font-medium text-stone-200',
            description: 'line-clamp-2 text-[11px] leading-5 text-stone-500',
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
                :alt="sourceLabel(article) || 'Source'"
                :icon="sourceFavicon(article) ? undefined : DEFAULT_SOURCE_ICON"
                loading="eager"
                referrerpolicy="no-referrer"
              />
            </UAvatarGroup>
            <UAvatar
              v-else
              :src="sourceFavicon(item.articles[0])"
              :alt="sourceLabel(item.articles[0]) || 'Source'"
              :icon="sourceFavicon(item.articles[0]) ? undefined : DEFAULT_SOURCE_ICON"
              loading="eager"
              referrerpolicy="no-referrer"
            />
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
        v-else-if="coverage_articles.length"
        class="divide-y divide-stone-800/80 rounded-lg border border-stone-800/90 bg-stone-900/50 px-3"
      >
        <component
          :is="article.url ? 'a' : 'div'"
          v-for="article in coverage_articles"
          :key="article.id"
          :href="article.url || undefined"
          :target="article.url ? '_blank' : undefined"
          :rel="article.url ? 'noopener noreferrer' : undefined"
          :class="[
            'group flex gap-2.5 py-3 transition-colors',
            article.url ? 'hover:bg-stone-800/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400' : 'cursor-default'
          ]"
          :aria-label="article.url ? `Open ${article.title}` : undefined"
        >
          <UAvatar
            :src="sourceFavicon(article)"
            :alt="sourceLabel(article) || 'Source'"
            :icon="sourceFavicon(article) ? undefined : DEFAULT_SOURCE_ICON"
            size="xs"
            class="mt-0.5 shrink-0 ring-1 ring-stone-800/80"
            loading="eager"
            referrerpolicy="no-referrer"
          />
          <div class="min-w-0 flex-1">
            <p
              v-if="sourceLabel(article)"
              class="truncate text-[11px] font-medium text-stone-500"
            >
              {{ sourceLabel(article) }}
            </p>
            <div class="mt-1 flex items-start gap-3">
              <h3 class="line-clamp-2 flex-1 text-sm font-medium leading-5 text-stone-200 group-hover:text-amber-100">
                {{ article.title }}
              </h3>
              <UIcon
                v-if="article.url"
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
        <span class="ml-2">No coverage articles yet.</span>
      </div>
    </section>
  </div>
</template>
