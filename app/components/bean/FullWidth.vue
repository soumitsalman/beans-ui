<script setup lang="ts">
import type { Bean, BeanTrend, BeanExtended, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: Bean | BeanTrend | BeanExtended
  publisher?: Publisher
}>()

const relativeTime = useRelativeTime(props.bean.published_at)
const siteName = computed(() => props.publisher?.source_site_name || props.bean.source)
const metricsBean = computed(() => props.bean as Partial<BeanTrend>)
const region = computed(() => props.bean.regions?.[0] || props.bean.categories?.[0] || 'Global')
const category = computed(() => props.bean.categories?.[0] || props.bean.regions?.[0] || 'Global')
const entities = computed(() => props.bean.entities?.slice(0, 3) || [])
const likes = computed(() => formatCount(metricsBean.value.likes))
const comments = computed(() => formatCount(metricsBean.value.comments))
const shares = computed(() => formatCount(metricsBean.value.shares))
const related = computed(() => metricsBean.value.num_related || 0)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :label="siteName" color="neutral" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
        <UBadge :label="category" color="primary" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
      </div>
    </template>
    <template #footer>
      
    </template>
  </UCard>
  <article class="group overflow-hidden rounded-[28px] bg-surface-container-low shadow-2xl ring-1 ring-white/5 transition-transform duration-300 hover:-translate-y-1">
    <div class="grid md:grid-cols-[1.1fr_0.9fr]">
      <div class="relative overflow-hidden min-h-64 md:min-h-full">
        <img
          :src="bean.image_url || 'https://picsum.photos/800/600'"
          :alt="bean.title"
          class="w-full h-full object-cover"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent md:bg-gradient-to-r" />
        <div class="absolute left-4 top-4 flex flex-wrap gap-2 md:left-6 md:top-6">
          <UBadge :label="siteName" color="neutral" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
          <UBadge :label="category" color="primary" variant="solid" size="xs" class="uppercase font-bold tracking-[0.18em]" />
        </div>
      </div>
      <div class="flex flex-col justify-between gap-6 p-6 md:p-8 lg:p-10">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge :label="region" color="primary" variant="soft" size="sm" class="uppercase font-bold tracking-[0.18em]" />
            <UBadge :label="relativeTime" color="neutral" variant="outline" size="sm" class="uppercase font-bold tracking-[0.18em]" />
          </div>
          <h3 class="text-2xl font-black leading-tight tracking-tight text-on-surface group-hover:text-primary transition-colors md:text-4xl">
            {{ bean.title }}
          </h3>
          <p v-if="bean.summary" class="max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
            {{ bean.summary }}
          </p>
          <div class="flex flex-wrap gap-2">
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
        </div>
        <div class="space-y-4 border-t border-white/10 pt-5">
          <div class="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            <span>{{ siteName }}</span>
            <span class="h-1 w-1 rounded-full bg-primary" />
            <span>{{ relativeTime }}</span>
            <span class="h-1 w-1 rounded-full bg-primary" />
            <span>{{ related }} Related</span>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap gap-2 text-on-surface-variant">
              <UBadge :label="`${likes} Likes`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
              <UBadge :label="`${comments} Comments`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
              <UBadge :label="`${shares} Shares`" color="neutral" variant="soft" size="xs" class="uppercase font-bold tracking-[0.18em]" />
            </div>
            <div class="flex gap-2">
              <UButton color="neutral" variant="soft" size="sm" square>
                <UIcon name="lucide:bookmark" class="h-4 w-4" />
              </UButton>
              <UButton color="neutral" variant="soft" size="sm" square>
                <UIcon name="lucide:share-2" class="h-4 w-4" />
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
