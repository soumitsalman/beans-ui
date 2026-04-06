<script setup lang="ts">
import type { Bean, Publisher } from '~/types/beans'

const props = defineProps<{
  beans: Bean[]
  publishers: Record<string, Publisher>
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => Promise<void>
}>()

const load_more_trigger = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (!load_more_trigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting) && props.hasMore && !props.loading && props.onLoadMore) {
        void props.onLoadMore()
      }
    },
    {
      threshold: 0.2
    }
  )
  observer.observe(load_more_trigger.value)
}

onMounted(async () => {
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
      <BeanCompact v-for="bean in props.beans" :key="bean.url" :bean="bean" :publisher="props.publishers[bean.source]" />
    </UPageList>
    <div ref="load_more_trigger" class="h-1 w-full" />
    <div v-if="props.loading && props.beans.length > 0" class="space-y-4">
      <BeanCompactSkeleton v-for="i in 2" :key="i" />
    </div>
  </div>
</template>
