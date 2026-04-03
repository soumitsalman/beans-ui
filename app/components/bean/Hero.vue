<script setup lang="ts">
import type { Bean, BeanTrend, BeanExtended, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: Bean | BeanTrend | BeanExtended
  publisher?: Publisher
}>()

const relativeTime = useRelativeTime(props.bean.published_at)
const siteName = computed(() => props.publisher?.source_site_name || props.bean.source)
const metricsBean = computed(() => props.bean as Partial<BeanTrend>)
const primaryCategory = computed(() => props.bean.categories?.[0] || props.bean.regions?.[0] || 'Global')
const secondaryTag = computed(() => props.bean.regions?.[0] && props.bean.regions?.[0] !== primaryCategory.value ? props.bean.regions?.[0] : null)
const entities = computed(() => props.bean.entities?.slice(0, 2) || [])
const likes = computed(() => formatCount(metricsBean.value.likes))
const comments = computed(() => formatCount(metricsBean.value.comments))
const shares = computed(() => formatCount(metricsBean.value.shares))
</script>

<template>
  <article class="group relative overflow-hidden rounded-[28px] bg-surface-container-low shadow-2xl ring-1 ring-white/5 transition-transform duration-300 hover:-translate-y-1">
    <div class="relative aspect-[16/10] md:aspect-[21/9] w-full overflow-hidden">
      <img
        :src="bean.image_url || 'https://picsum.photos/1200/600'"
        :alt="bean.title"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/35 to-transparent" />
      <div class="absolute left-4 top-4 flex flex-wrap gap-2 md:left-6 md:top-6">
        <UBadge :label="siteName" color="neutral" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
        <UBadge :label="primaryCategory" color="primary" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
        <UBadge v-if="secondaryTag" :label="secondaryTag" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
      </div>
      <div class="absolute right-4 top-4 flex gap-2 md:right-6 md:top-6">
        <UButton color="neutral" variant="soft" size="xs" square class="backdrop-blur-md">
          <UIcon name="lucide:bookmark" class="h-4 w-4" />
        </UButton>
        <UButton color="neutral" variant="soft" size="xs" square class="backdrop-blur-md">
          <UIcon name="lucide:share-2" class="h-4 w-4" />
        </UButton>
      </div>
    </div>
    <div class="absolute inset-x-0 bottom-0 p-5 md:p-8">
      <div class="max-w-4xl space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-200/80">
          <span>{{ relativeTime }}</span>
          <span class="h-1 w-1 rounded-full bg-primary" />
          <span>{{ bean.source }}</span>
        </div>
        <h2 class="max-w-3xl text-3xl font-black leading-[0.92] tracking-tight text-white transition-colors group-hover:text-primary md:text-5xl">
          {{ bean.title }}
        </h2>
        <p v-if="bean.summary" class="max-w-2xl text-sm leading-6 text-stone-200/80 md:text-base">
          {{ bean.summary }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <UBadge
            v-for="entity in entities"
            :key="entity"
            :label="entity"
            color="neutral"
            variant="soft"
            size="xs"
            class="uppercase font-bold tracking-[0.18em]"
          />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-stone-200/80">
          <div class="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em]">
            <span>{{ siteName }}</span>
            <span class="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
            <span>{{ relativeTime }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :label="`${likes} Likes`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
            <UBadge :label="`${comments} Comments`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
            <UBadge :label="`${shares} Shares`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
