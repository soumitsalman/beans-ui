<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NewsArticle } from '~/types/news'
import { coverageSources, OPEN_ORBIT_ARTICLE_LIMIT, positionCoverageSources, WREATH_SOURCE_LIMIT } from '~/utils/coverageOrbit'
import { formatCount } from '~/utils/formatters'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'

const props = defineProps<{ articles: NewsArticle[] }>()
const page = ref(0)
const sources = computed(() => coverageSources(props.articles))
const is_wreath = computed(() => props.articles.length > OPEN_ORBIT_ARTICLE_LIMIT)
const page_size = computed(() => is_wreath.value ? WREATH_SOURCE_LIMIT : OPEN_ORBIT_ARTICLE_LIMIT)
const page_count = computed(() => Math.ceil(sources.value.length / page_size.value))
const orbit_sources = computed(() => positionCoverageSources(sources.value, page.value, page_size.value))

watch(() => props.articles, () => {
  page.value = 0
})
</script>

<template>
  <div class="min-w-0 px-3 py-4">
    <div
      class="relative mx-auto aspect-square w-full max-w-72"
      :data-coverage-layout="is_wreath ? 'wreath' : 'open-orbit'"
      role="group"
      :aria-label="`${articles.length} articles from ${sources.length} sources`"
    >
      <div
        v-if="!is_wreath"
        class="absolute left-1/2 top-1/2 size-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-700/70"
        aria-hidden="true"
      />
      <div
        class="absolute left-1/2 top-1/2 flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full"
        :class="is_wreath ? 'w-[40%] bg-primary text-stone-950' : 'w-[34%] bg-primary/10 text-primary'"
        :aria-label="`${articles.length} articles`"
      >
        <span
          class="text-3xl font-semibold tabular-nums"
          :title="String(articles.length)"
        >{{ formatCount(articles.length) }}</span>
        <span class="text-[11px] opacity-80">{{ articles.length === 1 ? 'article' : 'articles' }}</span>
      </div>
      <div
        v-for="source in orbit_sources"
        :key="source.id"
        class="absolute -translate-x-1/2 -translate-y-1/2 hover:z-10 focus-within:z-10"
        :style="{ left: `${source.left_percent}%`, top: `${source.top_percent}%` }"
      >
        <UTooltip :text="`${sourceLabel(source.article) || 'Source'} · ${source.article_count} ${source.article_count === 1 ? 'article' : 'articles'}`">
          <NuxtLink
            :to="source.article.source?.id ? `/sources/${source.article.source.id}` : undefined"
            class="flex size-11 items-center justify-center rounded-full bg-stone-900 ring-2 ring-stone-900 focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="`${sourceLabel(source.article) || 'Source'}: ${source.article_count} ${source.article_count === 1 ? 'article' : 'articles'}`"
          >
            <UAvatar
              :src="sourceFavicon(source.article)"
              :alt="sourceLabel(source.article) || 'Source'"
              :icon="DEFAULT_SOURCE_ICON"
              :size="is_wreath ? '2xl' : 'xl'"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </NuxtLink>
        </UTooltip>
      </div>
    </div>
    <div
      v-if="page_count > 1"
      class="mt-2 flex items-center justify-center gap-3"
    >
      <UButton
        icon="lucide:chevron-left"
        aria-label="Previous coverage sources"
        color="neutral"
        variant="ghost"
        :disabled="page === 0"
        @click="page--"
      />
      <span
        class="text-xs tabular-nums text-stone-400"
        aria-live="polite"
      >Sources {{ page * page_size + 1 }}–{{ Math.min((page + 1) * page_size, sources.length) }} of {{ sources.length }}</span>
      <UButton
        icon="lucide:chevron-right"
        aria-label="Next coverage sources"
        color="neutral"
        variant="ghost"
        :disabled="page + 1 >= page_count"
        @click="page++"
      />
    </div>
  </div>
</template>
