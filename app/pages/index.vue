<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DEFAULT_FEED_CATEGORIES } from '~/settings/defaults'
import { fetchTrendingArticlesPage, fetchLatestArticlesPage, fetchPublishers } from '~/composables/useBeansApi'
import CategoryFeed from '~/components/feeds/CategoryFeed.vue'
import type { BeanTrend, Bean, Publisher } from '~/types/beans'

interface TabState {
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

const activeTab = ref<string>('all')
const tabStates = ref<Record<string, TabState>>({} as Record<string, TabState>)

// Initialize tab state if not exists
const getTabState = (tabId: string): TabState => {
  if (!tabStates.value[tabId]) {
    tabStates.value[tabId] = {
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
    }
  }
  return tabStates.value[tabId]
}

const mergePublishers = async (tabId: string, newBeans: (BeanTrend | Bean)[]) => {
  const state = getTabState(tabId)
  const missingSources = [...new Set(
    newBeans
      .map(bean => bean.source)
      .filter(source => source && !state.publishers[source])
  )]
  if (!missingSources.length) return

  const pubs = await fetchPublishers({ sources: missingSources })
  for (const pub of pubs) {
    if (pub.source) {
      state.publishers[pub.source] = pub
    }
  }
}

const loadTabData = async (tabId: string) => {
  const state = getTabState(tabId)
  if (state.loaded || state.loadingTopStories || state.loadingRecentUpdates) return

  state.loadingTopStories = true
  state.loadingRecentUpdates = true
  try {
    const q = tabId === 'all' ? undefined : DEFAULT_FEED_CATEGORIES.find(cat => cat.id === tabId)?.q
    const params = q ? { q } : {}

    const [trending, latest] = await Promise.all([
      fetchTrendingArticlesPage({ ...params, limit: PAGE_SIZE }),
      fetchLatestArticlesPage({ ...params, limit: PAGE_SIZE })
    ])

    state.topStories = trending ?? []
    state.recentUpdates = latest ?? []
    state.hasMoreTopStories = trending.length === PAGE_SIZE
    state.hasMoreRecentUpdates = latest.length === PAGE_SIZE
    state.topStoriesOffset = trending.length
    state.recentUpdatesOffset = latest.length

    await mergePublishers(tabId, [...state.topStories, ...state.recentUpdates])
    state.loaded = true
  } finally {
    state.loadingTopStories = false
    state.loadingRecentUpdates = false
  }
}

const loadMoreTopStories = async (tabId: string) => {
  const state = getTabState(tabId)
  if (!state.hasMoreTopStories || state.loadingTopStories) return

  state.loadingTopStories = true
  try {
    const q = tabId === 'all' ? undefined : DEFAULT_FEED_CATEGORIES.find(cat => cat.id === tabId)?.q
    const params = q ? { q } : {}

    const more = await fetchTrendingArticlesPage({ ...params, offset: state.topStoriesOffset, limit: PAGE_SIZE })
    if (more && more.length > 0) {
      state.topStories.push(...more)
      state.topStoriesOffset += more.length
      state.hasMoreTopStories = more.length === PAGE_SIZE
      await mergePublishers(tabId, more)
    } else {
      state.hasMoreTopStories = false
    }
  } finally {
    state.loadingTopStories = false
  }
}

const loadMoreRecentUpdates = async (tabId: string) => {
  const state = getTabState(tabId)
  if (!state.hasMoreRecentUpdates || state.loadingRecentUpdates) return

  state.loadingRecentUpdates = true
  try {
    const q = tabId === 'all' ? undefined : DEFAULT_FEED_CATEGORIES.find(cat => cat.id === tabId)?.q
    const params = q ? { q } : {}

    const more = await fetchLatestArticlesPage({ ...params, offset: state.recentUpdatesOffset, limit: PAGE_SIZE })
    if (more && more.length > 0) {
      state.recentUpdates.push(...more)
      state.recentUpdatesOffset += more.length
      state.hasMoreRecentUpdates = more.length === PAGE_SIZE
      await mergePublishers(tabId, more)
    } else {
      state.hasMoreRecentUpdates = false
    }
  } finally {
    state.loadingRecentUpdates = false
  }
}

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const currentTabState = computed(() => getTabState(activeTab.value))

const tabItems = computed(() => DEFAULT_FEED_CATEGORIES.map(cat => ({
  label: cat.label,
  value: cat.id
})))

watch(activeTab, async (tabId) => {
  await loadTabData(tabId)
}, { immediate: true })

onMounted(async () => {
  setActiveTab('all')
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl shadow-lg flex justify-between items-center px-6 h-16">
      <div class="flex items-center gap-4">
        <UButton variant="ghost" size="sm" square>
          <UIcon name="lucide:menu" class="w-6 h-6 text-primary" />
        </UButton>
        <h1 class="text-2xl font-black uppercase tracking-[-0.02em] text-stone-100">
          Beans
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <UButton variant="ghost" size="sm" square>
          <UIcon name="lucide:search" class="w-6 h-6 text-primary" />
        </UButton>
      </div>
    </header>

    <main class="py-24 px-4 max-w-5xl mx-auto space-y-4">
      <!-- Category Tabs -->
      <UTabs v-model="activeTab" :items="tabItems" />

      <!-- Active Category Feed -->
      <CategoryFeed
        :top-stories="currentTabState.topStories"
        :recent-updates="currentTabState.recentUpdates"
        :publishers="currentTabState.publishers"
        :loading-top-stories="currentTabState.loadingTopStories"
        :loading-recent-updates="currentTabState.loadingRecentUpdates"
        :has-more-top-stories="currentTabState.hasMoreTopStories"
        :has-more-recent-updates="currentTabState.hasMoreRecentUpdates"
        :on-load-more-top-stories="() => loadMoreTopStories(activeTab)"
        :on-load-more-recent-updates="() => loadMoreRecentUpdates(activeTab)"
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
