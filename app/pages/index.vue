<script setup lang="ts">
import { fetchTrendingArticles, fetchLatestArticles, fetchPublishers } from '~/composables/useBeansApi'
import type { BeanTrend, Bean, Publisher } from '~/types/beans'

const activeTab = ref<'top-stories' | 'recent-updates'>('top-stories')

const tabs = [
  { value: 'top-stories', label: 'Top Stories' },
  { value: 'recent-updates', label: 'Recent Updates' }
]

const topStories = ref<BeanTrend[]>([])
const recentUpdates = ref<Bean[]>([])
const publishers = ref<Record<string, Publisher>>({})
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const [trending, latest] = await Promise.all([
      fetchTrendingArticles({ q: 'Topic: Technology', limit: 5 }),
      fetchLatestArticles({ q: 'Topic: Technology', limit: 5 })
    ])
    topStories.value = trending
    recentUpdates.value = latest

    console.log(trending.length, latest.length)

    const sources = [...new Set([...trending, ...latest].map((b) => b.source))]
    const pubs = await fetchPublishers({ sources })
    publishers.value = pubs.reduce((acc: Record<string, Publisher>, pub: Publisher) => {
      if (pub.source) acc[pub.source] = pub
      return acc
    }, {})
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchData())
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

    <main class="pt-24 pb-32 px-4 max-w-5xl mx-auto gap-4">
      <h2>Top Stories</h2>
      <FeedsTopStories limit="5" />
      <h2>Recent Updates</h2>
      <FeedsRecentUpdates limit="5"/>      
    </main>

    <nav class="fixed bottom-0 left-0 right-0 h-20 bg-stone-950/90 backdrop-blur-xl border-t border-stone-800/50 flex justify-around items-center px-4 z-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)]">
      <UButton
        variant="ghost"
        size="sm"
        class="flex-col gap-1 h-auto py-2 px-4"
        :class="activeTab === 'top-stories' ? 'text-primary' : 'text-stone-500'"
      >
        <UIcon
          :name="activeTab === 'top-stories' ? 'lucide:rss' : 'lucide:rss'"
          :class="activeTab === 'top-stories' ? 'text-primary' : ''"
          class="w-6 h-6"
        />
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
