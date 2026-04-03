<script setup lang="ts">
import type { BeanTrend, BeanExtended, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: BeanTrend | BeanExtended
  publisher?: Publisher
}>()

const relativeTime = useRelativeTime(props.bean.published_at)
const siteName = computed(() => props.publisher?.source_site_name || props.bean.source)
const region = computed(() => props.bean.regions?.[0] || props.bean.categories?.[0] || 'Global')
</script>

<template>
  <div class="bg-surface-container rounded-full p-8 shadow-lg group cursor-pointer border-l-4 border-primary">
    <div class="flex justify-between items-center mb-3">
      <UBadge :label="siteName" color="neutral" variant="subtle" size="xs" class="uppercase font-bold tracking-widest" />
      <span class="text-[9px] font-bold uppercase tracking-[0.15em] text-outline">{{ relativeTime }}</span>
    </div>
    <h3 class="text-lg font-bold leading-snug group-hover:text-primary transition-colors mb-4">
      {{ bean.title }}
    </h3>
    <div class="flex gap-2 mb-4">
      <UBadge :label="region" color="neutral" variant="outline" size="xs" class="uppercase font-bold tracking-widest" />
    </div>
    <div class="flex items-center gap-4 text-on-surface-variant">
      <div class="flex items-center gap-1">
        <UIcon name="lucide:share-2" class="w-[16px] h-[16px]" />
        <span class="text-[10px] font-bold">{{ bean.shares || 0 }}</span>
      </div>
    </div>
  </div>
</template>
