<script setup lang="ts">
import { computed, onMounted } from 'vue'
import StorySection from '~/components/news/StorySection.vue'

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
} = useNewsFeed()

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
  title: 'Beans | Live news',
  description: 'Top stories from the last 24 hours and the latest incoming news.'
})

onMounted(() => {
  void refreshFeed()
})
</script>

<template>
  <div class="space-y-9">
    <div class="space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/70">
        Live desk
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        The story, not the noise.
      </h1>
    </div>

    <StorySection
      v-if="loading_top_headlines || top_headlines.length || can_load_more_top_headlines || top_headlines_error"
      title="Top headlines"
      eyebrow="Last 24 hours"
      :stories="top_headlines"
      mode="compressed"
      variant="carousel"
      :loading="loading_top_headlines"
      :can_load_more="can_load_more_top_headlines"
      :error_message="top_headlines_error"
      empty_message="No top headlines are available yet."
      @load-more="loadMoreTopHeadlines"
      @retry="retryTopHeadlines"
    />

    <StorySection
      v-if="loading_latest_news || latest_news.length || can_load_more_latest_news || latest_news_error"
      title="Latest news"
      eyebrow="Just in"
      :stories="latest_news"
      mode="snapshot"
      :loading="loading_latest_news"
      :can_load_more="can_load_more_latest_news"
      :error_message="latest_news_error"
      empty_message="No latest news is available yet."
      @load-more="loadMoreLatestNews"
      @retry="retryLatestNews"
    />

    <UAlert
      v-if="feeds_are_empty"
      color="neutral"
      variant="subtle"
      icon="lucide:inbox"
      title="No news is available right now."
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
