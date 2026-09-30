<script setup lang="ts">
import type { NewsArticle } from '~/types/news'
import ArticleCard from '~/components/news/ArticleCard.vue'

withDefaults(defineProps<{
  title?: string
  articles: NewsArticle[]
  loading: boolean
  can_load_more: boolean
  error_message?: string | null
  empty_message?: string
  trend_with_date?: boolean
}>(), {
  title: undefined,
  error_message: null,
  empty_message: 'Nothing is available yet.',
  trend_with_date: false
})

const emit = defineEmits<{
  'load-more': []
  'retry': []
}>()
</script>

<template>
  <section class="space-y-3">
    <h2
      v-if="title"
      class="px-1 text-base font-semibold text-stone-100 sm:text-lg"
    >
      {{ title }}
    </h2>

    <UAlert
      v-if="error_message"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="error_message"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          :loading="loading"
          @click="emit('retry')"
        />
      </template>
    </UAlert>

    <div
      v-if="articles.length"
      class="space-y-3"
    >
      <ArticleCard
        v-for="article in articles"
        :key="article.id || article.url || 'article'"
        :article="article"
        :trend_with_date="trend_with_date"
      />
    </div>

    <div
      v-else-if="loading"
      class="space-y-3"
      aria-label="Loading articles"
    >
      <USkeleton
        v-for="item in 2"
        :key="item"
        class="h-52 rounded-lg bg-stone-800"
      />
    </div>
    <UAlert
      v-else-if="!error_message"
      color="neutral"
      variant="subtle"
      icon="lucide:inbox"
      :title="empty_message"
    />

    <div
      v-if="can_load_more && (articles.length > 0 || (!loading && !error_message))"
      class="flex justify-center pt-1"
    >
      <UButton
        label="More"
        icon="lucide:plus"
        color="neutral"
        variant="outline"
        :loading="loading"
        @click="emit('load-more')"
      />
    </div>
  </section>
</template>
