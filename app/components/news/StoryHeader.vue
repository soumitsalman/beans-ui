<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import ArticleSignals from '~/components/news/ArticleSignals.vue'
import StoryDateLine from '~/components/news/StoryDateLine.vue'
import { formatTaxonomyLabel } from '~/utils/formatters'

defineProps<{ story: NewsArticle }>()
</script>

<template>
  <div class="flex min-w-0 items-center justify-between gap-3">
    <div class="flex min-w-0 flex-1 justify-start">
      <UBadge
        v-if="story.categories[0]"
        color="neutral"
        variant="soft"
        size="sm"
        class="max-w-full truncate bg-stone-800/80 text-primary/90"
      >
        {{ formatTaxonomyLabel(story.categories[0]) }}
      </UBadge>
    </div>
    <div class="ml-auto flex shrink-0 items-center justify-end gap-2">
      <StoryDateLine :article="story" />
      <ArticleSignals
        :article="story"
        :show_ideology="false"
      />
    </div>
  </div>
</template>
