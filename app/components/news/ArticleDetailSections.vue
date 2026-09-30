<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsArticle } from '~/types/news'
import ArticleTrendCounts from '~/components/news/ArticleTrendCounts.vue'
import { formatFriendlyTime } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceIdentity, sourceLabel } from '~/utils/source'

interface CoverageGroup {
  id: string
  articles: NewsArticle[]
  date: string
  icons: NewsArticle[]
}

interface CoverageView {
  id: string
  classes: string
  groups: CoverageGroup[]
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
const selected_group_id = ref<string | null>(null)
const sorted_articles = computed(() => [...props.coverage_articles].sort((left, right) => articleTime(left) - articleTime(right)))
const first_article = computed(() => sorted_articles.value[0])
const last_article = computed(() => sorted_articles.value.length > 1 ? sorted_articles.value.at(-1) : undefined)
const middle_articles = computed(() => sorted_articles.value.slice(1, -1))

const coverage_views = computed<CoverageView[]>(() => [
  { id: 'small', classes: 'flex sm:hidden', groups: createGroups(middle_articles.value, 1, 1, 'small') },
  { id: 'medium', classes: 'hidden sm:flex xl:hidden', groups: createGroups(middle_articles.value, 3, 2, 'medium') },
  { id: 'large', classes: 'hidden xl:flex', groups: createGroups(middle_articles.value, 5, 3, 'large') }
])
const selected_group = computed(() => coverage_views.value.flatMap(view => view.groups).find(group => group.id === selected_group_id.value))

watch(() => props.coverage_articles, () => {
  selected_group_id.value = null
})

function createGroups(articles: NewsArticle[], max_groups: number, max_icons: number, prefix: string): CoverageGroup[] {
  const group_count = Math.min(max_groups, articles.length)
  if (!group_count) return []

  const groups = Array.from({ length: group_count }, () => [] as NewsArticle[])
  articles.forEach((article, index) => {
    groups[Math.floor(index * group_count / articles.length)]?.push(article)
  })

  return groups.map((group, index) => {
    const first_date = shortDate(group[0]?.published_at)
    const last_date = shortDate(group.at(-1)?.published_at)
    const source_ids = new Set<string>()
    const icons = group.filter((article) => {
      const source_id = sourceIdentity(article) || article.id || article.url || ''
      if (source_ids.has(source_id) || source_ids.size >= max_icons) return false
      source_ids.add(source_id)
      return true
    })

    return {
      id: `${prefix}-${index}`,
      articles: group,
      date: first_date === last_date ? first_date : `${first_date} – ${last_date}`,
      icons
    }
  })
}

function shortDate(value?: string | null): string {
  if (!value) return 'Date unknown'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unknown'
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
}

function toggleGroup(id: string): void {
  selected_group_id.value = selected_group_id.value === id ? null : id
}

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

      <div
        v-if="first_article"
        class="min-w-0 space-y-3"
      >
        <div
          v-for="view in coverage_views"
          :key="view.id"
          :class="[view.classes, 'relative w-full min-w-0 items-stretch gap-1.5 sm:gap-2']"
        >
          <div
            class="absolute inset-x-5 top-4 h-px bg-stone-800"
            aria-hidden="true"
          />
          <a
            :href="first_article.url ? outboundHref(first_article.url) : undefined"
            :target="first_article.url ? '_blank' : undefined"
            :rel="first_article.url ? 'noopener noreferrer' : undefined"
            :aria-label="`First coverage: ${first_article.title || sourceLabel(first_article) || 'article'}`"
            class="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg bg-stone-950 px-1 py-2 text-center focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UAvatar
              :src="sourceFavicon(first_article)"
              :alt="sourceLabel(first_article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              size="xs"
              class="ring-1 ring-stone-800"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span
              class="w-full truncate text-[10px] tabular-nums text-stone-500"
              :title="shortDate(first_article.published_at)"
            >
              {{ shortDate(first_article.published_at) }}
            </span>
          </a>

          <UButton
            v-for="group in view.groups"
            :key="group.id"
            :color="selected_group_id === group.id ? 'primary' : 'neutral'"
            variant="subtle"
            :aria-label="`${group.date}: ${group.articles.length} articles. ${selected_group_id === group.id ? 'Hide' : 'Show'} coverage`"
            :aria-expanded="selected_group_id === group.id"
            :aria-controls="selected_group_id === group.id ? 'coverage-group-details' : undefined"
            class="relative z-10 min-w-0 flex-1 flex-col gap-1 overflow-hidden px-1 py-1.5 text-center"
            @click="toggleGroup(group.id)"
          >
            <span class="flex max-w-full min-w-0 items-center justify-center gap-1 overflow-hidden">
              <span class="flex shrink-0 -space-x-1.5">
                <UAvatar
                  v-for="(article, icon_index) in group.icons"
                  :key="article.id || article.url || icon_index"
                  :src="sourceFavicon(article)"
                  :alt="sourceLabel(article) || 'Source'"
                  :icon="DEFAULT_SOURCE_ICON"
                  size="2xs"
                  class="ring-1 ring-stone-950"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
              </span>
              <span
                v-if="group.articles.length > group.icons.length"
                class="min-w-0 truncate text-[10px] tabular-nums"
              >
                +{{ group.articles.length - group.icons.length }}
              </span>
            </span>
            <span
              class="w-full truncate text-[10px] tabular-nums"
              :title="group.date"
            >{{ group.date }}</span>
            <span class="w-full truncate text-[10px] tabular-nums opacity-70">
              {{ group.articles.length }} {{ group.articles.length === 1 ? 'article' : 'articles' }}
            </span>
          </UButton>

          <a
            v-if="last_article"
            :href="last_article.url ? outboundHref(last_article.url) : undefined"
            :target="last_article.url ? '_blank' : undefined"
            :rel="last_article.url ? 'noopener noreferrer' : undefined"
            :aria-label="`Latest coverage: ${last_article.title || sourceLabel(last_article) || 'article'}`"
            class="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg bg-stone-950 px-1 py-2 text-center focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UAvatar
              :src="sourceFavicon(last_article)"
              :alt="sourceLabel(last_article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              size="xs"
              class="ring-1 ring-stone-800"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <span
              class="w-full truncate text-[10px] tabular-nums text-stone-500"
              :title="shortDate(last_article.published_at)"
            >
              {{ shortDate(last_article.published_at) }}
            </span>
          </a>
        </div>

        <div
          v-if="selected_group"
          id="coverage-group-details"
          role="region"
          :aria-label="`Coverage from ${selected_group.date}`"
          class="min-w-0 rounded-lg border border-stone-800/90 bg-stone-900/50"
        >
          <div class="flex min-w-0 items-center justify-between gap-2 border-b border-stone-800/80 px-3 py-2">
            <div class="min-w-0 truncate text-xs text-stone-300">
              {{ selected_group.date }} · {{ selected_group.articles.length }} {{ selected_group.articles.length === 1 ? 'article' : 'articles' }}
            </div>
            <UButton
              icon="lucide:x"
              aria-label="Close coverage group"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="selected_group_id = null"
            />
          </div>
          <div class="max-h-72 min-w-0 overflow-y-auto divide-y divide-stone-800/80 px-3">
            <a
              v-for="(article, article_index) in selected_group.articles"
              :key="article.id || article.url || article_index"
              :href="article.url ? outboundHref(article.url) : undefined"
              :target="article.url ? '_blank' : undefined"
              :rel="article.url ? 'noopener noreferrer' : undefined"
              class="flex min-w-0 items-start gap-2 py-2.5 text-sm text-stone-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <UAvatar
                :src="sourceFavicon(article)"
                :alt="sourceLabel(article) || 'Source'"
                :icon="DEFAULT_SOURCE_ICON"
                size="xs"
                class="mt-0.5 shrink-0 ring-1 ring-stone-800"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[11px] text-stone-500">
                  {{ sourceLabel(article) || 'Source' }} · {{ formatFriendlyTime(article.published_at) || 'Date unknown' }}
                </span>
                <span class="line-clamp-2 leading-5">{{ article.title || 'Article' }}</span>
              </span>
              <UIcon
                v-if="article.url"
                name="lucide:arrow-up-right"
                class="mt-1 size-4 shrink-0 text-stone-600"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>

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
