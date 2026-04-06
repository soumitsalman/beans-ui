<script setup lang="ts">
import type { BeanTrend, Publisher } from '~/types/beans'

const props = defineProps<{
  beans: BeanTrend[]
  publishers: Record<string, Publisher>
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => Promise<void>
}>()

const skeleton_items = computed(() => {
  if (!props.loading || props.beans.length === 0) return []
  return [{}, {}]
})

const carousel_items = computed(() => {
  if (props.loading && props.beans.length > 0) {
    return [...props.beans, ...skeleton_items.value]
  }
  return props.beans
})

const onCarouselSelect = (index: number) => {
  // Load more when approaching the end (within last 2 items)
  if (index >= props.beans.length - 2 && props.hasMore && !props.loading && props.onLoadMore) {
    void props.onLoadMore()
  }
}
</script>

<template>
  <div class="space-y-4">
    <UCarousel
      v-if="carousel_items.length > 0"
      ref="carousel"
      v-slot="{ item, index }"
      wheel-gestures
      :items="carousel_items"
      :ui="{ item: 'basis-full md:basis-5/12' }"
      @select="onCarouselSelect"
    >
      <BeanCard
        v-if="index < props.beans.length"
        :bean="item as BeanTrend"
        :publisher="props.publishers[(item as BeanTrend).source]"
      />
      <BeanCardSkeleton v-else />
    </UCarousel>
  </div>
</template>
