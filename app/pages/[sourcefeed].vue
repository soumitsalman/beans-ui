<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { fetchTrendingArticlesPage, fetchLatestArticlesPage, fetchPublishers } from '~/composables/useBeansApi'
import CategoryFeed from '~/components/feeds/CategoryFeed.vue'
import type { BeanTrend, Bean, Publisher } from '~/types/beans'

interface SourceFeedState {
  topStories: BeanTrend[]
  recentUpdates: Bean[]
  publishers: Record<string, Publisher>
  loadingTopStories: boolean
  loadingRecentUpdates: boolean
  hasMoreTopStories: boolean
  hasMoreRecentUpdates: boolean
  topStoriesOffset: number
  recentUpdatesOffset: number
  loaded: boolean
}

const PAGE_SIZE = 5

const route = useRoute()
const sourcefeed = computed(() => route.params.sourcefeed as string)

const sourceFeedState = ref<SourceFeedState>({
  topStories: [],
  recentUpdates: [],
  publishers: {},
  loadingTopStories: false,
  loadingRecentUpdates: false,
  hasMoreTopStories: true,
  hasMoreRecentUpdates: true,
  topStoriesOffset: 0,
  recentUpdatesOffset: 0,
  loaded: false
})

const mergePublishers = async (newBeans: (BeanTrend | Bean)[]) => {
  const missingSources = [...new Set(
    newBeans
      .map(bean => bean.source)
      .filter(source => source && !sourceFeedState.value.publishers[source])
  )]
  if (!missingSources.length) return

  const pubs = await fetchPublishers({ sources: missingSources })
  for (const pub of pubs) {
    if (pub.source) {
      sourceFeedState.value.publishers[pub.source] = pub
    }
  }
}

const loadSourceFeedData = async () => {
  if (sourceFeedState.value.loaded || sourceFeedState.value.loadingTopStories || sourceFeedState.value.loadingRecentUpdates) return
  if (!sourcefeed.value) return

  sourceFeedState.value.loadingTopStories = true
  sourceFeedState.value.loadingRecentUpdates = true
  try {
    const sources = [sourcefeed.value]
    const params = { sources }

    const [trending, latest] = await Promise.all([
      fetchTrendingArticlesPage({ ...params, limit: PAGE_SIZE }),
      fetchLatestArticlesPage({ ...params, limit: PAGE_SIZE })
    ])

    sourceFeedState.value.topStories = trending ?? []
    sourceFeedState.value.recentUpdates = latest ?? []
    sourceFeedState.value.hasMoreTopStories = trending.length === PAGE_SIZE
    sourceFeedState.value.hasMoreRecentUpdates = latest.length === PAGE_SIZE
    sourceFeedState.value.topStoriesOffset = trending.length
    sourceFeedState.value.recentUpdatesOffset = latest.length

    await mergePublishers([...sourceFeedState.value.topStories, ...sourceFeedState.value.recentUpdates])
    sourceFeedState.value.loaded = true
  } finally {
    sourceFeedState.value.loadingTopStories = false
    sourceFeedState.value.loadingRecentUpdates = false
  }
}

const loadMoreTopStories = async () => {
  if (!sourceFeedState.value.hasMoreTopStories || sourceFeedState.value.loadingTopStories) return
  if (!sourcefeed.value) return

  sourceFeedState.value.loadingTopStories = true
  try {
    const sources = [sourcefeed.value]
    const more = await fetchTrendingArticlesPage({ sources, offset: sourceFeedState.value.topStoriesOffset, limit: PAGE_SIZE })
    if (more && more.length > 0) {
      sourceFeedState.value.topStories.push(...more)
      sourceFeedState.value.topStoriesOffset += more.length
      sourceFeedState.value.hasMoreTopStories = more.length === PAGE_SIZE
      await mergePublishers(more)
    } else {
      sourceFeedState.value.hasMoreTopStories = false
    }
  } finally {
    sourceFeedState.value.loadingTopStories = false
  }
}

const loadMoreRecentUpdates = async () => {
  if (!sourceFeedState.value.hasMoreRecentUpdates || sourceFeedState.value.loadingRecentUpdates) return
  if (!sourcefeed.value) return

  sourceFeedState.value.loadingRecentUpdates = true
  try {
    const sources = [sourcefeed.value]
    const more = await fetchLatestArticlesPage({ sources, offset: sourceFeedState.value.recentUpdatesOffset, limit: PAGE_SIZE })
    if (more && more.length > 0) {
      sourceFeedState.value.recentUpdates.push(...more)
      sourceFeedState.value.recentUpdatesOffset += more.length
      sourceFeedState.value.hasMoreRecentUpdates = more.length === PAGE_SIZE
      await mergePublishers(more)
    } else {
      sourceFeedState.value.hasMoreRecentUpdates = false
    }
  } finally {
    sourceFeedState.value.loadingRecentUpdates = false
  }
}

watch(sourcefeed, async () => {
  sourceFeedState.value.loaded = false
  await loadSourceFeedData()
}, { immediate: true })

onMounted(async () => {
  await loadSourceFeedData()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl shadow-lg flex justify-between items-center px-6 h-16">
      <div class="flex items-center gap-4">
        <UButton variant="ghost" size="sm" square @click="navigateTo('/')">
          <UIcon name="lucide:arrow-left" class="w-6 h-6 text-primary" />
        </UButton>
        <h1 class="text-2xl font-black uppercase tracking-[-0.02em] text-stone-100">
          {{ sourcefeed }}
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <UButton variant="ghost" size="sm" square>
          <UIcon name="lucide:search" class="w-6 h-6 text-primary" />
        </UButton>
      </div>
    </header>

    <main class="py-24 px-4 max-w-5xl mx-auto space-y-4">
      <CategoryFeed
        :top-stories="sourceFeedState.topStories"
        :recent-updates="sourceFeedState.recentUpdates"
        :publishers="sourceFeedState.publishers"
        :loading-top-stories="sourceFeedState.loadingTopStories"
        :loading-recent-updates="sourceFeedState.loadingRecentUpdates"
        :has-more-top-stories="sourceFeedState.hasMoreTopStories"
        :has-more-recent-updates="sourceFeedState.hasMoreRecentUpdates"
        :on-load-more-top-stories="loadMoreTopStories"
        :on-load-more-recent-updates="loadMoreRecentUpdates"
      />
    </main>

    <nav class="fixed bottom-0 left-0 right-0 h-20 bg-stone-950/90 backdrop-blur-xl border-t border-stone-800/50 flex justify-around items-center px-4 z-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)]">
      <UButton
        variant="ghost"
        size="sm"
        class="flex-col gap-1 h-auto py-2 px-4 text-stone-500"
      >
        <UIcon name="lucide:rss" class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-widest">Feed</span>
      </UButton>
      <UButton
        variant="ghost"
        size="sm"
        class="flex-col gap-1 h-auto py-2 px-4 text-stone-500"
      >
        <UIcon name="lucide:compass" class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-widest">Explore</span>
      </UButton>
      <UButton
        variant="ghost"
        size="sm"
        class="flex-col gap-1 h-auto py-2 px-4 text-stone-500"
      >
        <UIcon name="lucide:bookmark" class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-widest">Saved</span>
      </UButton>
      <UButton
        variant="ghost"
        size="sm"
        class="flex-col gap-1 h-auto py-2 px-4 text-stone-500"
      >
        <UIcon name="lucide:settings" class="w-6 h-6" />
        <span class="text-[10px] font-bold uppercase tracking-widest">Settings</span>
      </UButton>
    </nav>
  </div>
</template>