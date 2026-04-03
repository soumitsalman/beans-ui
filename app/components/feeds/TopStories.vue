<script setup lang="ts">
import { fetchPublishers, fetchTrendingArticlesPage } from '~/composables/useBeansApi'
import type { BeanTrend, Publisher } from '~/types/beans'

const props = defineProps<{
  limit?: number
}>()

const PAGE_SIZE = 5

const beans = ref<BeanTrend[]>([])
const publishers = ref<Record<string, Publisher>>({})
const initial_loading = ref(true)
const loading_more = ref(false)
const has_more = ref(true)
const scroll_container = ref<HTMLElement | null>(null)
const load_more_trigger = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const remainingLimit = computed(() => {
  if (!props.limit) return PAGE_SIZE
  return Math.max(0, props.limit - beans.value.length)
})

const mergePublishers = async (new_beans: BeanTrend[]) => {
  const missing_sources = [...new Set(
    new_beans
      .map(bean => bean.source)
      .filter(source => source && !publishers.value[source])
  )]
  if (!missing_sources.length) return

  const pubs = await fetchPublishers({ sources: missing_sources })
  for (const pub of pubs) {
    if (pub.source) {
      publishers.value[pub.source] = pub
    }
  }
}

const loadMore = async () => {
  if (loading_more.value || !has_more.value) return
  if (props.limit && remainingLimit.value <= 0) {
    has_more.value = false
    return
  }

  loading_more.value = true
  try {
    const batch_size = props.limit ? Math.min(PAGE_SIZE, remainingLimit.value) : PAGE_SIZE
    const next_batch = await fetchTrendingArticlesPage({
      limit: batch_size,
      offset: beans.value.length
    })

    const known_urls = new Set(beans.value.map(bean => bean.url))
    const appended = next_batch.filter(bean => !known_urls.has(bean.url))
    beans.value.push(...appended)

    await mergePublishers(appended)

    has_more.value = next_batch.length === batch_size
    if (props.limit && beans.value.length >= props.limit) {
      has_more.value = false
    }
  } finally {
    loading_more.value = false
    initial_loading.value = false
  }
}

const setupObserver = () => {
  if (!scroll_container.value || !load_more_trigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        void loadMore()
      }
    },
    {
      root: scroll_container.value,
      threshold: 0.8
    }
  )
  observer.observe(load_more_trigger.value)
}

onMounted(async () => {
  await loadMore()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="space-y-4">
    <template v-if="initial_loading">
      <div class="flex gap-4 overflow-x-hidden">
        <div v-for="i in 2" :key="i" class="min-w-[85%] animate-pulse">
          <div class="aspect-[21/9] rounded-[28px] bg-surface-container-low" />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        ref="scroll_container"
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="bean in beans"
          :key="bean.url"
          class="min-w-[85%] snap-start md:min-w-[72%]"
        >
          <BeanFullWidth :bean="bean" :publisher="publishers[bean.source]" />
        </div>
        <div ref="load_more_trigger" class="h-1 w-1 shrink-0 self-center" />
      </div>
      <div v-if="loading_more" class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
        Loading More
      </div>
    </template>
  </div>
</template>
