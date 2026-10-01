<script setup lang="ts">
import { onMounted } from 'vue'
import ArticleSection from '~/components/news/ArticleSection.vue'

const {
  articles,
  loading,
  can_load_more,
  error_message,
  refreshFeed,
  loadMore,
  retryFeed
} = useNewsFeed()

useSeoMeta({
  title: 'Beans | Live news',
  description: 'Trending and latest news from publishers.'
})

onMounted(() => {
  void refreshFeed()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="sr-only">
      Beans
    </h1>
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
