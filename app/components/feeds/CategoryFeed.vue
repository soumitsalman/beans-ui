<script setup lang="ts">
import type { Bean, BeanTrend, Publisher } from '~/types/beans'
import FeedsTopStories from '~/components/feeds/TopStories.vue'
import FeedsRecentUpdates from '~/components/feeds/RecentUpdates.vue'

const props = defineProps<{
  topStories: BeanTrend[]
  recentUpdates: Bean[]
  publishers: Record<string, Publisher>
  loadingTopStories?: boolean
  loadingRecentUpdates?: boolean
  hasMoreTopStories?: boolean
  hasMoreRecentUpdates?: boolean
  onLoadMoreTopStories?: () => Promise<void>
  onLoadMoreRecentUpdates?: () => Promise<void>
}>()
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-extrabold tracking-tight">Top Stories</h2>
    <FeedsTopStories
      :beans="props.topStories"
      :publishers="props.publishers"
      :loading="props.loadingTopStories"
      :has-more="props.hasMoreTopStories"
      :on-load-more="props.onLoadMoreTopStories"
    />

    <h2 class="text-lg font-bold">Recent Updates</h2>
    <FeedsRecentUpdates
      :beans="props.recentUpdates"
      :publishers="props.publishers"
      :loading="props.loadingRecentUpdates"
      :has-more="props.hasMoreRecentUpdates"
      :on-load-more="props.onLoadMoreRecentUpdates"
    />
  </div>
</template>