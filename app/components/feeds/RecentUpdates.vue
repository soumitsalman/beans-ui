<script setup lang="ts">
import { fetchLatestArticlesPage, fetchPublishers } from '~/composables/useBeansApi'
import type { Bean, Publisher } from '~/types/beans'

const props = defineProps<{
  limit?: number
}>()

const PAGE_SIZE = 5

const beans = ref<Bean[]>([])
const publishers = ref<Record<string, Publisher>>({})
const initial_loading = ref(true)
const loading_more = ref(false)
const has_more = ref(true)
const load_more_trigger = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const remainingLimit = computed(() => {
  if (!props.limit) return PAGE_SIZE
  return Math.max(0, props.limit - beans.value.length)
})

const mergePublishers = async (new_beans: Bean[]) => {
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
    const next_batch = await fetchLatestArticlesPage({
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
  if (!load_more_trigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        void loadMore()
      }
    },
    {
      threshold: 0.2
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
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="h-24 bg-surface-container-low rounded-full" />
      </div>
    </template>
    <template v-else>
      <BeanCompact v-for="bean in beans" :key="bean.url" :bean="bean" :publisher="publishers[bean.source]" />
      <div ref="load_more_trigger" class="h-1 w-full" />
      <div v-if="loading_more" class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
        Loading More
      </div>
    </template>
  </div>
</template>
