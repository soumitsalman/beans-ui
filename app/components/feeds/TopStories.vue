<script setup lang="ts">
import { fetchPublishers, fetchTrendingArticlesPage } from '~/composables/useBeansApi'
import type { BeanTrend, Publisher } from '~/types/beans'

const PAGE_SIZE = 5

const beans = ref<BeanTrend[]>([])
const publishers = ref<Record<string, Publisher>>({})
const loading = ref(false)
const has_more = ref(true)
const current_offset = ref(0)
const carousel = useTemplateRef('carousel')

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
  if (loading.value || !has_more.value) return

  loading.value = true
  try {
    const batch_size = PAGE_SIZE
    const resp = await fetchTrendingArticlesPage({
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

const onCarouselSelect = (index: number) => {
  // Load more when approaching the end (within last 2 items)
  if (index >= beans.value.length - 2 && has_more.value && !loading.value) {
    void loadMore()
  }
}

onMounted(async () => {
  await loadMore()
})
</script>

<template>
  <div class="space-y-4">
    <UCarousel
      v-if="beans.length > 0"
      ref="carousel"
      v-slot="{ item: bean }"
      :items="beans"
      :ui="{ item: 'basis-full md:basis-5/12' }"
      @select="onCarouselSelect"
    >
      <BeanCard :bean="bean" :publisher="publishers[bean.source]" />
      
    </UCarousel>
    <div v-if="loading" class="flex justify-center items-center py-8">
        <UIcon name="i-svg-spinners-blocks-scale" class="w-6 h-6 animate-spin" />
      </div>
    
  </div>
</template>
