<script setup lang="ts">
import ArticleSection from '~/components/news/ArticleSection.vue'

const {
  articles,
  loading,
  can_load_more,
  error_message,
  initialiseFeed,
  refreshFeed,
  loadMore,
  retryFeed
} = useNewsFeed(undefined, undefined, 'trending')

usePageMetadata({
  title: 'Beans | Trending news from publishers',
  description: 'See how different publishers cover the same story. Explore current news, related reporting and coverage timelines with Beans.',
  kind: 'CollectionPage'
})

// Preserve SSR payloads on hydration; let later navigation render the loading state.
if (import.meta.server || useNuxtApp().isHydrating) await initialiseFeed()
else void refreshFeed()
if (import.meta.server && error_message.value && !articles.value.length) setResponseStatus(useRequestEvent()!, 503)
useSeoMeta({ robots: () => error_message.value && !articles.value.length ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
</script>

<template>
  <div class="space-y-6">
    <div class="max-w-2xl space-y-2 px-1">
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        Trending News
      </h1>
    </div>
    <ArticleSection
      :articles="articles"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      empty_message="No news is available right now."
      @load-more="loadMore"
      @retry="retryFeed"
    />
  </div>
</template>
