<script setup lang="ts">
import type { BeanTrend, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: BeanTrend
  publisher?: Publisher
}>()

const relativeTime = useRelativeTime(props.bean.published_at)
const siteName = computed(() => props.publisher?.source_site_name || props.bean.source)
const authorName = computed(() => props.bean.author)
const category = computed(() => props.bean.categories?.[0] || props.bean.regions?.[0] || 'Global')
const bodyTags = computed(() => [...new Set([...(props.bean.entities || []), ...(props.bean.regions || [])])].slice(0, 5))
const trendLevel = computed(() => {
  const trend_score = props.bean.trend_score || 0
  if (trend_score >= 10000) return 'hot'
  if (trend_score >= 3000) return 'regular'
  return null
})
const trendIcon = computed(() => trendLevel.value === 'hot' ? 'lucide:flame' : 'lucide:trending-up')
const likes = computed(() => props.bean.likes || 0)
const comments = computed(() => props.bean.comments || 0)
const shares = computed(() => props.bean.shares || 0)
const related = computed(() => props.bean.num_related || 0)
</script>

<template>
  <div class="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-surface-container-low shadow-2xl ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container-high">
    <NuxtLink to="#" class="absolute inset-0 z-10" :aria-label="bean.title" />

    <div v-if="bean.image_url" class="relative aspect-[21/9] overflow-hidden">
      <img
        :src="bean.image_url"
        :alt="bean.title"
        class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <div class="absolute left-4 top-4 z-20 flex items-center gap-2 md:left-6 md:top-6">
        <UBadge
          v-if="trendLevel"
          :label="trendLevel === 'hot' ? 'Hot' : 'Trending'"
          :color="trendLevel === 'hot' ? 'primary' : 'neutral'"
          :variant="trendLevel === 'hot' ? 'solid' : 'soft'"
          size="xs"
          class="uppercase font-bold tracking-[0.18em]"
        >
          <template #leading>
            <UIcon :name="trendIcon" class="h-3.5 w-3.5" />
          </template>
        </UBadge>
      </div>

      <div class="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <UBadge color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em] backdrop-blur-md">
          {{ relativeTime }}
        </UBadge>
      </div>
    </div>

    <div class="flex flex-col gap-3 p-4 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :label="category" color="primary" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
      </div>

      <h2 class="text-2xl font-black leading-[1.05] tracking-tight text-on-surface transition-colors duration-300 group-hover:text-primary md:text-4xl line-clamp-3 overflow-hidden min-h-[87px] md:min-h-[114px]">
        {{ bean.title }}
      </h2>

      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="tag in bodyTags"
          :key="tag"
          :label="tag"
          color="neutral"
          variant="soft"
          size="xs"
          class="uppercase font-bold tracking-[0.18em]"
        />
      </div>
    </div>

    <div class="p-4 pt-0">
      <div class="relative z-20 flex flex-wrap items-center justify-between gap-4">
        <UUser
          :avatar="{ src: publisher?.source_favicon, alt: siteName }"
          :name="siteName"
          :description="authorName"
          size="sm"
          class="min-w-0"
          :ui="{
            name: 'text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant',
            description: 'text-[11px] font-medium text-on-surface-variant',
          }"
        />

        <div class="flex flex-wrap items-center gap-2 text-on-surface-variant">
          <UButton icon="i-lucide-thumbs-up" color="neutral" variant="soft" size="xs" class="gap-1.5 backdrop-blur-md text-[11px] font-bold" @click.stop>{{ formatCount(likes) }}</UButton>
          <UButton icon="i-lucide-message-circle" color="neutral" variant="soft" size="xs" class="gap-1.5 backdrop-blur-md text-[11px] font-bold" @click.stop>{{ formatCount(comments) }}</UButton>
          <UButton icon="i-lucide-link-2" color="neutral" variant="soft" size="xs" class="gap-1.5 backdrop-blur-md text-[11px] font-bold" @click.stop>{{ related }}</UButton>
          <UButton icon="i-lucide-share-2" color="neutral" variant="soft" size="xs" class="gap-1.5 backdrop-blur-md text-[11px] font-bold" @click.stop>{{ formatCount(shares) }}</UButton>
          <UButton icon="i-lucide-bookmark" color="neutral" variant="soft" size="xs" square class="backdrop-blur-md" @click.stop aria-label="Bookmark" />
        </div>
      </div>
    </div>
  </div>
</template>
