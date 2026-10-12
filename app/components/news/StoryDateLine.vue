<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import { formatFriendlyTime } from '~/utils/formatters'

defineProps<{ article: NewsArticle }>()
</script>

<template>
  <time
    v-if="article.published_at"
    :datetime="article.published_at"
    class="text-[11px] font-normal tabular-nums text-stone-500"
  >
    {{ formatFriendlyTime(article.published_at) }}
  </time>
</template>
