<script setup lang="ts">
import { computed } from 'vue'
import type { NewsArticle } from '~/types/news'
import { formatFriendlyTime } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

const props = defineProps<{ article: NewsArticle }>()
const date_label = computed(() => formatFriendlyTime(props.article.published_at))
</script>

<template>
  <div class="flex min-w-0 items-center gap-1.5">
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
      <span class="truncate text-sm font-semibold text-stone-200">{{ sourceLabel(article) || 'Source' }}</span>
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
      <span class="truncate text-sm font-semibold text-stone-200">{{ sourceLabel(article) || 'Source' }}</span>
    </div>
    <time
      v-if="date_label"
      :datetime="article.published_at || undefined"
      class="shrink-0 text-[11px] font-normal tabular-nums text-stone-500"
    >
      · {{ date_label }}
    </time>
  </div>
</template>
