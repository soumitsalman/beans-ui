<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import ArticleTrendCounts from '~/components/news/ArticleTrendCounts.vue'
import { formatFriendlyTime } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

interface TimelineItem {
  articles: NewsArticle[]
  date: string
}

const props = defineProps<{
  coverage_articles: NewsArticle[]
  related_articles: NewsArticle[]
  loading_coverage: boolean
  loading_related: boolean
  can_load_more_related: boolean
  coverage_error?: string | null
  related_error?: string | null
}>()

const emit = defineEmits<{
  'retry-coverage': []
  'retry-related': []
  'load-more-related': []
}>()

const { outboundHref } = useOutboundUrl()
const MAX_TIMELINE_ITEMS = 5
const MIDDLE_GROUPS = 3

const timeline_items = computed<TimelineItem[]>(() => {
  const articles = [...props.coverage_articles].sort((left, right) => articleTime(left) - articleTime(right))
  if (articles.length <= MAX_TIMELINE_ITEMS) {
    return articles.map(article => ({
      articles: [article],
      date: formatFriendlyTime(article.published_at)
    }))
  }

  const first_article = articles[0]
  const last_article = articles.at(-1)
  if (!first_article || !last_article) return []

  const middle_articles = articles.slice(1, -1)
  const groups = Array.from({ length: MIDDLE_GROUPS }, () => [] as NewsArticle[])
  middle_articles.forEach((article, index) => {
    const group_index = Math.min(groups.length - 1, Math.floor(index * groups.length / middle_articles.length))
    groups[group_index]?.push(article)
  })

  return [[first_article], ...groups, [last_article]].map((group) => {
    const first = group[0]
    const last = group.at(-1)
    const first_label = formatFriendlyTime(first?.published_at)
    const last_label = formatFriendlyTime(last?.published_at)
    return {
      articles: group,
      date: first_label && last_label && first_label !== last_label
        ? `${first_label} – ${last_label}`
        : first_label || last_label
    }
  })
})

function articleTime(article: NewsArticle): number {
  const value = article.published_at ? new Date(article.published_at).getTime() : Number.POSITIVE_INFINITY
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value
}
</script>

<template>
  <div class="space-y-7">
    <section class="space-y-3">
      <div class="flex items-center gap-2 px-1">
        <UIcon
          name="lucide:git-fork"
          class="size-4 text-primary"
          aria-hidden="true"
        />
        <h2 class="text-sm font-semibold text-stone-100">
          Coverage
        </h2>
        <UIcon
          v-if="loading_coverage"
          name="lucide:loader-circle"
          class="size-3.5 animate-spin text-stone-500"
          aria-label="Loading coverage"
        />
        <span class="ml-auto text-xs tabular-nums text-stone-500">
          {{ coverage_articles.length }} {{ coverage_articles.length === 1 ? 'article' : 'articles' }}
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

      <UTimeline
        v-if="timeline_items.length"
        :items="timeline_items"
        orientation="horizontal"
        color="neutral"
        size="sm"
        :ui="{
          root: 'w-full',
          item: 'min-w-0',
          container: 'min-w-0',
          wrapper: 'min-w-0 pe-1.5',
          date: 'text-[10px] leading-tight text-pretty tabular-nums text-stone-500',
          title: 'hidden',
          description: 'hidden',
          indicator: 'ring-1 ring-stone-800'
        }"
      >
        <template #indicator="{ item }">
          <div class="flex -space-x-2">
            <UAvatar
              v-for="article in item.articles"
              :key="article.id"
              :src="sourceFavicon(article)"
              :alt="sourceLabel(article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              size="xs"
              class="ring-2 ring-stone-950"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
        </template>
        <template #wrapper="{ item }">
          <span
            v-if="item.date"
            class="block break-words text-[10px] leading-tight tabular-nums text-stone-500"
          >
            {{ item.date }}
          </span>
        </template>
      </UTimeline>

      <div
        v-else-if="!loading_coverage && !coverage_error"
        class="flex h-20 items-center justify-center rounded-lg border border-dashed border-stone-800 text-sm text-stone-600"
      >
        No coverage is available.
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex items-center gap-2 px-1">
        <UIcon
          name="lucide:files"
          class="size-4 text-primary"
          aria-hidden="true"
        />
        <h2 class="text-sm font-semibold text-stone-100">
          Related
        </h2>
      </div>

      <UAlert
        v-if="related_error"
        color="warning"
        variant="subtle"
        icon="lucide:triangle-alert"
        :title="related_error"
      >
        <template #actions>
          <UButton
            label="Retry"
            color="warning"
            variant="outline"
            size="xs"
            :loading="loading_related"
            @click="emit('retry-related')"
          />
        </template>
      </UAlert>

      <div
        v-if="related_articles.length"
        class="divide-y divide-stone-800/80 rounded-lg border border-stone-800/90 bg-stone-900/50 px-3"
      >
        <a
          v-for="article in related_articles"
          :key="article.id"
          :href="outboundHref(article.url)"
          :target="article.url ? '_blank' : undefined"
          :rel="article.url ? 'noopener noreferrer' : undefined"
          :class="[
            'group flex gap-2.5 py-3 transition-colors',
            article.url ? 'hover:bg-stone-800/40 focus-visible:outline-2 focus-visible:outline-primary' : 'cursor-default'
          ]"
          :aria-label="article.url ? `Open ${article.title || 'article'}` : undefined"
        >
          <UAvatar
            :src="sourceFavicon(article)"
            :alt="sourceLabel(article) || 'Source'"
            :icon="DEFAULT_SOURCE_ICON"
            size="xs"
            class="mt-0.5 shrink-0 ring-1 ring-stone-800/80"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-3 text-[11px] text-stone-500">
              <p class="min-w-0 truncate font-medium">{{ sourceLabel(article) || 'Source' }}</p>
              <ArticleTrendCounts
                :trend="article.trend"
                class="ml-auto shrink-0"
              />
            </div>
            <div class="mt-1 flex items-start gap-3">
              <h3 class="line-clamp-2 flex-1 text-sm font-medium leading-5 text-stone-200 group-hover:text-primary">
                {{ article.title || 'Article' }}
              </h3>
              <UIcon
                v-if="article.url"
                name="lucide:arrow-up-right"
                class="mt-0.5 size-4 shrink-0 text-stone-600 group-hover:text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        </a>
      </div>

      <div
        v-else-if="loading_related"
        class="space-y-2 rounded-lg border border-stone-800/90 bg-stone-900/50 p-3"
      >
        <USkeleton class="h-12 rounded-md bg-stone-800" />
        <USkeleton class="h-12 rounded-md bg-stone-800" />
      </div>
      <div
        v-else-if="!related_error"
        class="flex h-20 items-center justify-center rounded-lg border border-dashed border-stone-800 text-sm text-stone-600"
      >
        No related articles are available.
      </div>

      <div
        v-if="can_load_more_related"
        class="flex justify-center pt-1"
      >
        <UButton
          label="More"
          icon="lucide:plus"
          color="neutral"
          variant="outline"
          :loading="loading_related"
          @click="emit('load-more-related')"
        />
      </div>
    </section>
  </div>
</template>
