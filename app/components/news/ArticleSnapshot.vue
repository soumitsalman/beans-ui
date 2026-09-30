<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsArticle } from '~/types/news'
import MarkdownSummary from '~/components/news/MarkdownSummary.vue'
import StoryConfidenceBadge from '~/components/news/StoryConfidenceBadge.vue'
import { formatFriendlyTime, formatTaxonomyLabel } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

const props = defineProps<{ article: NewsArticle }>()
const { outboundHref } = useOutboundUrl()
const image_failed = ref(false)
const trend_score = computed(() => props.article.trend?.trend_score)
const trend_icon = computed(() => {
  if (typeof trend_score.value !== 'number') return undefined
  if (trend_score.value >= 10000) return 'lucide:flame'
  if (trend_score.value >= 1000) return 'lucide:trending-up'
  return 'lucide:activity'
})
const trend_label = computed(() => trend_score.value == null
  ? undefined
  : trend_score.value >= 10000 ? 'Hot' : trend_score.value >= 1000 ? 'Trending' : 'Recent activity')

watch(() => props.article.image_url, () => {
  image_failed.value = false
})
</script>

<template>
  <article class="overflow-hidden rounded-lg border border-stone-800/90 bg-stone-900/60">
    <div class="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <a
        v-if="article.image_url && !image_failed"
        :href="outboundHref(article.image_url)"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Open image for ${article.title || 'article'}`"
        class="aspect-video w-full shrink-0 overflow-hidden rounded-md bg-stone-800 sm:aspect-square sm:size-36"
      >
        <img
          :src="article.image_url"
          :alt="article.title"
          class="size-full object-cover"
          loading="eager"
          referrerpolicy="no-referrer"
          @error="image_failed = true"
        >
      </a>

      <div class="min-w-0 flex-1 space-y-3">
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
          <NuxtLink
            v-if="article.source?.id"
            :to="`/sources/${article.source.id}`"
            class="flex min-w-0 items-center gap-1.5 hover:text-primary"
          >
            <UAvatar
              :src="sourceFavicon(article)"
              :alt="sourceLabel(article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              size="xs"
              loading="eager"
              referrerpolicy="no-referrer"
            />
            <span class="truncate font-medium">{{ sourceLabel(article) || 'Source' }}</span>
          </NuxtLink>
          <span
            v-else
            class="flex min-w-0 items-center gap-1.5"
          >
            <UAvatar
              :src="sourceFavicon(article)"
              :alt="sourceLabel(article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              size="xs"
              loading="eager"
              referrerpolicy="no-referrer"
            />
            <span class="truncate font-medium">{{ sourceLabel(article) || 'Source' }}</span>
          </span>
          <time
            v-if="article.published_at"
            :datetime="article.published_at"
            class="tabular-nums"
          >
            {{ formatFriendlyTime(article.published_at) }}
          </time>
          <span class="ml-auto flex items-center gap-2">
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
            <StoryConfidenceBadge :confidence="article.confidence" />
          </span>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="category in article.categories.slice(0, 1)"
            :key="category"
            color="neutral"
            variant="soft"
            class="bg-stone-800/80 text-primary/90"
          >
            {{ formatTaxonomyLabel(category) }}
          </UBadge>
          <UBadge
            v-for="region in article.regions.slice(0, 3)"
            :key="`region-${region}`"
            color="neutral"
            variant="soft"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(region) }}
          </UBadge>
          <UBadge
            v-for="entity in article.entities.slice(0, 3)"
            :key="`entity-${entity}`"
            color="neutral"
            variant="soft"
            class="max-w-40 truncate bg-stone-800/80 text-stone-400"
          >
            {{ formatTaxonomyLabel(entity) }}
          </UBadge>
        </div>

        <h1 class="text-lg font-semibold leading-snug text-stone-100 sm:text-xl">
          {{ article.title || 'Article' }}
        </h1>
        <MarkdownSummary
          v-if="article.summary"
          :summary="article.summary"
          :line_limit="3"
        />
      </div>
    </div>
  </article>
</template>
