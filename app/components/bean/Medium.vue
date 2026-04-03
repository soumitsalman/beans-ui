<script setup lang="ts">
import type { BeanTrend, BeanExtended, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: BeanTrend | BeanExtended
  publisher?: Publisher
}>()

const relativeTime = useRelativeTime(props.bean.published_at)
const siteName = computed(() => props.publisher?.source_site_name || props.bean.source)
const likes = computed(() => props.bean.likes || 0)
const comments = computed(() => props.bean.comments || 0)
const numRelated = computed(() => props.bean.num_related || 0)
const topEntity = computed(() => props.bean.entities?.[0] || props.bean.author)
</script>

<template>
  <div class="md:col-span-7 group cursor-pointer">
    <div class="bg-surface-container-low rounded-full overflow-hidden flex flex-col h-full shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div class="aspect-video w-full overflow-hidden">
        <img
          :src="bean.image_url || 'https://picsum.photos/800/450'"
          :alt="bean.title"
          class="w-full h-full object-cover"
        >
      </div>
      <div class="p-8">
        <div class="flex justify-between items-start mb-4">
          <UBadge :label="topEntity" color="primary" variant="subtle" size="xs" class="uppercase font-bold tracking-widest" />
          <UButton variant="ghost" size="xs" square>
            <UIcon name="lucide:heart" class="w-5 h-5 text-primary" />
          </UButton>
        </div>
        <h3 class="text-xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
          {{ bean.title }}
        </h3>
        <div class="flex items-center gap-3 mb-6">
          <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{{ siteName }}</span>
          <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-outline">{{ relativeTime }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-surface-variant pt-6">
          <div class="flex gap-4">
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <UIcon name="lucide:thumbs-up" class="w-[18px] h-[18px]" />
              <span class="text-[11px] font-bold">{{ likes }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <UIcon name="lucide:message-circle" class="w-[18px] h-[18px]" />
              <span class="text-[11px] font-bold">{{ comments }}</span>
            </div>
          </div>
          <UBadge v-if="numRelated > 0" :label="`${numRelated} Related`" color="primary" variant="soft" size="xs" class="uppercase font-bold tracking-widest" />
        </div>
      </div>
    </div>
  </div>
</template>
