<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsArticle, NewsPublisher } from '~/types/news'
import StoryConfidenceBadge from '~/components/news/StoryConfidenceBadge.vue'
import ArticleTrendCounts from '~/components/news/ArticleTrendCounts.vue'
import { formatCount, formatFriendlyTime, formatTaxonomyLabel } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceIdentity, sourceLabel } from '~/utils/source'
import { hasPositiveCount } from '~/utils/trend'

const props = defineProps<{
  article: NewsArticle
  trend_with_date?: boolean
}>()
const { outboundHref } = useOutboundUrl()
const image_failed = ref(false)
const title_link = computed(() => props.article.story_id && props.article.id
  ? `/articles/${props.article.id}`
  : undefined)
const external_article_url = computed(() => !title_link.value && props.article.url
  ? outboundHref(props.article.url)
  : undefined)
const date_label = computed(() => formatFriendlyTime(props.article.published_at))
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
const image_entities = computed(() => props.article.entities.filter(Boolean).slice(0, 2))
const image_regions = computed(() => props.article.regions.filter(Boolean).slice(0, 2))
const related_count = computed(() => props.article.trend?.related)
const show_card_footer = computed(() => Boolean(props.article.other_publishers?.length)
  || hasPositiveCount(related_count.value)
  || [props.article.trend?.mentions, props.article.trend?.comments, props.article.trend?.likes].some(hasPositiveCount))

watch(() => props.article.image_url, () => {
  image_failed.value = false
})

function publisherIdentity(publisher: NewsPublisher): string {
  return publisher.source?.id || sourceIdentity(publisher) || publisher.id
}

function publisherLabel(publisher: NewsPublisher): string {
  return sourceLabel(publisher) || 'Publisher'
}

function publisherHref(publisher: NewsPublisher): string | undefined {
  return publisher.source?.id ? `/sources/${publisher.source.id}` : undefined
}
</script>

<template>
  <article class="overflow-hidden rounded-lg border border-stone-800/90 bg-stone-900/60">
    <div class="flex items-center gap-2.5 px-3.5 pt-3.5">
      <NuxtLink
        v-if="article.source?.id"
        :to="`/sources/${article.source.id}`"
        class="flex min-w-0 items-center gap-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        :aria-label="`Open ${sourceLabel(article) || 'source'}`"
      >
        <UAvatar
          :src="sourceFavicon(article)"
          :alt="sourceLabel(article) || 'Source'"
          :icon="DEFAULT_SOURCE_ICON"
          size="sm"
          class="shrink-0 ring-1 ring-stone-800/80"
          loading="eager"
          referrerpolicy="no-referrer"
        />
        <span class="truncate text-sm font-semibold text-stone-200">
          {{ sourceLabel(article) || 'Source' }}
        </span>
      </NuxtLink>
      <div
        v-else
        class="flex min-w-0 items-center gap-2"
      >
        <UAvatar
          :src="sourceFavicon(article)"
          :alt="sourceLabel(article) || 'Source'"
          :icon="DEFAULT_SOURCE_ICON"
          size="sm"
          class="shrink-0 ring-1 ring-stone-800/80"
          loading="eager"
          referrerpolicy="no-referrer"
        />
        <span class="truncate text-sm font-semibold text-stone-200">
          {{ sourceLabel(article) || 'Source' }}
        </span>
      </div>

      <div
        v-if="date_label || (trend_with_date && trend_icon)"
        class="ml-auto flex shrink-0 items-center gap-2 text-[11px]"
      >
        <time
          v-if="date_label"
          :datetime="article.published_at || undefined"
          class="tabular-nums text-stone-500"
        >
          {{ date_label }}
        </time>
        <span
          v-if="trend_with_date && trend_icon"
          class="inline-flex items-center gap-1 text-primary"
          :aria-label="trend_label"
        >
          <UIcon
            :name="trend_icon"
            class="size-3.5"
            aria-hidden="true"
          />
          <span v-if="trend_score != null && trend_score >= 1000">{{ trend_label }}</span>
        </span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 px-3.5 pt-2 text-[11px] text-stone-500">
      <span
        v-if="article.categories[0]"
        class="max-w-full min-w-0 truncate font-medium text-primary/80"
      >
        {{ formatTaxonomyLabel(article.categories[0]) }}
      </span>
      <div class="ml-auto flex shrink-0 items-center justify-end gap-2">
        <span
          v-if="!trend_with_date && trend_icon"
          class="inline-flex items-center gap-1 text-primary"
          :aria-label="trend_label"
        >
          <UIcon
            :name="trend_icon"
            class="size-3.5"
            aria-hidden="true"
          />
          <span v-if="trend_score != null && trend_score >= 1000">{{ trend_label }}</span>
        </span>
      </div>
    </div>

    <div class="px-3.5 pb-3 pt-1">
      <h2 class="text-[15px] font-semibold leading-snug text-stone-100 sm:text-base">
        <NuxtLink
          v-if="title_link"
          :to="title_link"
          class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {{ article.title }}
        </NuxtLink>
        <a
          v-else-if="external_article_url"
          :href="external_article_url"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          {{ article.title }}
        </a>
        <span v-else>{{ article.title }}</span>
        <template v-if="article.confidence">
          {{ ' ' }}
          <span class="inline-flex align-middle">
            <StoryConfidenceBadge :confidence="article.confidence" />
          </span>
        </template>
        {{ ideology ? ' ' : '' }}
        <UBadge
          v-if="ideology"
          color="neutral"
          variant="outline"
          size="sm"
          :class="[
            'shrink-0 rounded-full bg-transparent px-1.5 py-0.5 align-middle font-medium normal-case tracking-normal',
            ideology === 'left' ? 'ring-blue-500/70 text-blue-400' : 'ring-red-500/70 text-red-400'
          ]"
        >
          Leans {{ ideology === 'left' ? 'Left' : 'Right' }}
        </UBadge>
      </h2>
    </div>

    <a
      v-if="article.image_url && !image_failed"
      :href="outboundHref(article.image_url)"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`Open image for ${article.title || 'article'}`"
      class="group/image relative block max-h-[34rem] overflow-hidden bg-stone-800"
    >
      <img
        :src="article.image_url"
        :alt="article.title"
        class="max-h-[34rem] w-full object-cover"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="image_failed = true"
      >
      <div
        v-if="image_entities.length || image_regions.length"
        class="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent px-3 pb-3 pt-8"
      >
        <UBadge
          v-for="region in image_regions"
          :key="`region-${region}`"
          color="neutral"
          variant="soft"
          size="sm"
          class="max-w-32 truncate bg-stone-950/75 text-stone-200"
        >
          {{ formatTaxonomyLabel(region) }}
        </UBadge>
        <UBadge
          v-for="entity in image_entities"
          :key="`entity-${entity}`"
          color="neutral"
          variant="soft"
          size="sm"
          class="max-w-32 truncate bg-stone-950/75 text-stone-200"
        >
          {{ formatTaxonomyLabel(entity) }}
        </UBadge>
      </div>
    </a>

    <div
      v-if="show_card_footer"
      class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-800/80 px-3.5 py-3 text-[11px] text-stone-500"
    >
      <div
        v-if="article.other_publishers?.length"
        class="flex items-center"
      >
        <template
          v-for="publisher in article.other_publishers"
          :key="publisherIdentity(publisher)"
        >
          <NuxtLink
            v-if="publisherHref(publisher)"
            :to="publisherHref(publisher)"
            :aria-label="`Open ${publisherLabel(publisher)}`"
            class="-ml-2 first:ml-0 rounded-full focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <UAvatar
              :src="sourceFavicon(publisher)"
              :alt="publisherLabel(publisher)"
              :icon="DEFAULT_SOURCE_ICON"
              size="sm"
              class="ring-2 ring-stone-950"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </NuxtLink>
          <UAvatar
            v-else
            :src="sourceFavicon(publisher)"
            :alt="publisherLabel(publisher)"
            :icon="DEFAULT_SOURCE_ICON"
            size="sm"
            class="-ml-2 first:ml-0 ring-2 ring-stone-950"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </template>
      </div>
      <span
        v-if="hasPositiveCount(related_count)"
        class="shrink-0 tabular-nums"
      >
        {{ formatCount(related_count) }} {{ related_count === 1 ? 'article' : 'articles' }}
      </span>
      <ArticleTrendCounts
        :trend="article.trend"
        class="ml-auto"
      />
    </div>
  </article>
</template>
