<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import StorySection from '~/components/news/StorySection.vue'
import { findCategory } from '~/settings/categories'

const route = useRoute()
const category = computed(() => findCategory(String(route.params.category_slug)))

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown category.' })
}

const {
  top_headlines,
  latest_news,
  loading_top_headlines,
  loading_latest_news,
  can_load_more_top_headlines,
  can_load_more_latest_news,
  top_headlines_error,
  latest_news_error,
  refreshFeed,
  loadMoreTopHeadlines,
  loadMoreLatestNews,
  retryTopHeadlines,
  retryLatestNews
} = useNewsFeed(category)

const feeds_are_empty = computed(() => !loading_top_headlines.value
  && !loading_latest_news.value
  && !top_headlines.value.length
  && !latest_news.value.length
  && !can_load_more_top_headlines.value
  && !can_load_more_latest_news.value
  && !top_headlines_error.value
  && !latest_news_error.value
)

useSeoMeta({
  title: () => `${category.value?.label || 'Category'} | Beans`,
  description: () => category.value?.description || 'A focused news category.'
})

onMounted(() => {
  void refreshFeed()
})

watch(() => route.params.category_slug, () => {
  if (!category.value) {
    void navigateTo('/')
    return
  }

  void refreshFeed(true)
})
</script>

<template>
  <div class="space-y-9">
    <div class="max-w-2xl space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
        Category
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        {{ category?.label }}
      </h1>
      <p class="text-sm leading-6 text-stone-400">
        {{ category?.description }}
      </p>
    </div>

    <StorySection
      v-if="loading_top_headlines || top_headlines.length || can_load_more_top_headlines || top_headlines_error"
      title="Trending"
      :stories="top_headlines"
      mode="compressed"
      variant="carousel"
      :loading="loading_top_headlines"
      :can_load_more="can_load_more_top_headlines"
      :error_message="top_headlines_error"
      empty_message="No top headlines are available in this category yet."
      @load-more="loadMoreTopHeadlines"
      @retry="retryTopHeadlines"
    />

    <StorySection
      v-if="loading_latest_news || latest_news.length || can_load_more_latest_news || latest_news_error"
      title="Just In"
      :stories="latest_news"
      mode="snapshot"
      :loading="loading_latest_news"
      :can_load_more="can_load_more_latest_news"
      :error_message="latest_news_error"
      empty_message="No latest news is available in this category yet."
      @load-more="loadMoreLatestNews"
      @retry="retryLatestNews"
    />

    <UAlert
      v-if="feeds_are_empty"
      color="neutral"
      variant="subtle"
      icon="lucide:inbox"
      title="No news is available in this category right now."
      description="Try again in a moment."
    >
      <template #actions>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          size="xs"
          @click="() => refreshFeed()"
        />
      </template>
    </UAlert>
  </div>
</template>
