<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle, NewsStory } from '~/types/news'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'
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

const avatar_size = computed(() => ({
  xs: 'xs',
  sm: 'sm',
  md: 'md'
})[props.size] as 'xs' | 'sm' | 'md')

const source_items = computed<StorySource[]>(() => {
  const sources: StorySource[] = []
  const seen = new Set<string>()

  const addSource = (article?: StorySource) => {
    if (!article) return

    const source_key = sourceKey(article)
    if (!source_key || seen.has(source_key)) return

    seen.add(source_key)
    sources.push(article)
  }

  for (const article of (props.story.top_articles ?? []).slice(0, props.max_sources)) {
    addSource(article)
  }

  if (!sources.length) sources.push({ source: props.story.source })

  return sources
})

const source_total = computed(() => Math.max(0, props.story.source_count))

function sourceKey(article: StorySource) {
  return article.source?.id
    || article.source?.base_url
    || article.url
    || sourceFavicon(article)
    || sourceLabel(article)
    || 'source'
}
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <UAvatarGroup
      v-if="source_items.length"
      :max="max_sources"
      :size="avatar_size"
      :ui="{ base: 'ring-stone-950/95' }"
    >
      <UAvatar
        v-for="source in source_items"
        :key="sourceKey(source)"
        :src="sourceFavicon(source)"
        :alt="sourceLabel(source) || 'Source'"
        :icon="sourceFavicon(source) ? undefined : DEFAULT_SOURCE_ICON"
        loading="eager"
        referrerpolicy="no-referrer"
      />
    </UAvatarGroup>
    <UIcon
      v-else
      name="lucide:radio"
      class="size-4 text-stone-600"
      aria-hidden="true"
    />
    <span
      v-if="source_total"
      class="shrink-0 text-[11px] tabular-nums text-stone-500"
    >
      {{ formatCount(source_total) }} {{ source_total === 1 ? 'source' : 'sources' }}
    </span>
  </div>
</template>
