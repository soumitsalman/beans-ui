<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NewsArticle, NewsStory } from '~/types/news'
import { DEFAULT_SOURCE_ICON, hasResolvableSource, sourceFavicon, sourceIdentity, sourceLabel } from '~/utils/source'
import { formatCount } from '~/utils/formatters'

type StorySource = Pick<NewsArticle, 'source' | 'url'>

interface StorySourceStackProps {
  story: NewsStory
  max_sources?: number
  size?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<StorySourceStackProps>(), {
  max_sources: 5,
  size: 'sm'
})

const failed_favicons = ref(new Set<string>())

const avatar_size = computed(() => ({
  xs: 'xs',
  sm: 'sm',
  md: 'md'
})[props.size] as 'xs' | 'sm' | 'md')

const source_items = computed<StorySource[]>(() => {
  const sources: StorySource[] = []
  const seen = new Set<string>()

  const addSource = (article?: StorySource) => {
    if (!article || !hasResolvableSource(article)) return

    const source_key = sourceKey(article)
    if (!source_key || seen.has(source_key)) return

    seen.add(source_key)
    sources.push(article)
  }

  for (const article of props.story.top_articles ?? []) {
    addSource(article)
    if (sources.length >= props.max_sources) break
  }

  if (!sources.length) {
    const fallback = { source: props.story.source, url: props.story.url }
    if (sourceIdentity(fallback) || sourceFavicon(fallback) || sourceLabel(fallback)) {
      sources.push(fallback)
    }
  }

  return sources
})

const article_total = computed(() => props.story.article_count)

function sourceKey(article: StorySource) {
  return sourceIdentity(article)
    || sourceFavicon(article)
    || sourceLabel(article)
    || ''
}

function resolvedFavicon(article: StorySource) {
  const source_key = sourceKey(article)
  if (failed_favicons.value.has(source_key)) return undefined

  return sourceFavicon(article)
}

function markFaviconFailed(article: StorySource) {
  const source_key = sourceKey(article)
  const next_failed = new Set(failed_favicons.value)
  next_failed.add(source_key)
  failed_favicons.value = next_failed
}
</script>

<template>
  <div
    v-if="source_items.length || article_total"
    class="flex min-w-0 items-center gap-2"
  >
    <UAvatarGroup
      v-if="source_items.length"
      :max="max_sources"
      :size="avatar_size"
      :ui="{ base: 'ring-stone-950/95' }"
    >
      <UAvatar
        v-for="source in source_items"
        :key="sourceKey(source)"
        :src="resolvedFavicon(source)"
        :alt="sourceLabel(source) || 'Source'"
        :icon="DEFAULT_SOURCE_ICON"
        loading="eager"
        referrerpolicy="no-referrer"
        @error="markFaviconFailed(source)"
      />
    </UAvatarGroup>
    <span
      v-if="article_total"
      class="shrink-0 text-[11px] tabular-nums text-stone-500"
    >
      {{ formatCount(article_total) }} {{ article_total === 1 ? 'article' : 'articles' }}
    </span>
  </div>
</template>
