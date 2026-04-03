<script setup lang="ts">
import { fetchLatestArticlesPage, fetchPublishers } from '~/composables/useBeansApi'
import type { Bean, Publisher } from '~/types/beans'

const PAGE_SIZE = 5

const beans = ref<Bean[]>([])
const publishers = ref<Record<string, Publisher>>({})
const loading = ref(false)
const has_more = ref(true)
const load_more_trigger = ref<HTMLElement | null>(null)
const current_offset = ref(0)

let observer: IntersectionObserver | null = null

// No total cap: page by fixed PAGE_SIZE and track offset with current_offset

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
  if (loading.value || !has_more.value) return

  loading.value = true
  try {
    const batch_size = PAGE_SIZE
    const resp = await fetchLatestArticlesPage({
      limit: batch_size,
      offset: current_offset.value
    })
    const next_batch = resp ?? []

    const known_urls = new Set(beans.value.map(bean => bean.url))
    const appended = next_batch.filter(bean => !known_urls.has(bean.url))
    beans.value.push(...appended)

    await mergePublishers(appended)

    has_more.value = next_batch.length === batch_size
    current_offset.value += next_batch.length
  } finally {
    loading.value = false
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
  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="space-y-4">
    <UPageList divide>
      <BeanCompact v-for="bean in beans" :key="bean.url" :bean="bean" :publisher="publishers[bean.source]" />
    </UPageList>
    <div ref="load_more_trigger" class="h-1 w-full" />
    <div v-if="loading" class="flex justify-center items-center py-4">
      <UIcon name="i-svg-spinners-blocks-scale" class="w-5 h-5 animate-spin" />
    </div>
  </div>
</template>
