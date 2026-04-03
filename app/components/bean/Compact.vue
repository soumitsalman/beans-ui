<script setup lang="ts">
import type { Bean, BeanTrend, BeanExtended, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: Bean
  publisher?: Publisher
}>()

const site_name = computed(() => props.publisher?.source_site_name || props.bean.source)
const favicon = computed(() => props.publisher?.source_favicon || `https://www.google.com/s2/favicons?sz=64&domain=${props.publisher?.source_base_url}`)
const published_at = useRelativeTime(props.bean.published_at)
const category = computed(() => props.bean.categories?.[0])
const entity = computed(() => props.bean.entities?.[0])
</script>

<template>
  <article class="group overflow-hidden rounded-[24px] bg-surface-container-high shadow-xl ring-1 ring-white/5 transition-transform duration-300 hover:-translate-y-0.5">
    <div class="flex gap-4 p-3 sm:p-4">
      <div v-if="bean.image_url" class="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] sm:h-28 sm:w-28">
        <img
          :src="bean.image_url"
          :alt="bean.title"
          class="h-full w-full object-cover grayscale opacity-70 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-stone-950/35 to-transparent" />
      </div>
      <div class="min-w-0 flex-1 space-y-2 gap-2 py-1">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :label="category" color="primary" variant="solid" size="xs" class="uppercase font-bold" />
          <UBadge v-if="entity" :label="entity" color="secondary" variant="soft" size="xs" class="uppercase font-bold" />
        </div>
        
        <h3 class="line-clamp-2 font-bold leading-5 text-on-surface group-hover:text-primary transition-colors sm:text-base">
          {{ bean.title }}
        </h3>

        <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant sm:text-[11px]">
          <span class="inline-flex items-center gap-1">
            <img v-if="favicon" :src="favicon" class="h-3 w-3 rounded-full" />
            {{ site_name }}
          </span>
          <span class="h-1 w-1 rounded-full bg-primary" />
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{{ published_at }}</span>
        </div>
      </div>
      <!-- <div class="flex items-start gap-2 pt-1">
        <UButton color="neutral" variant="ghost" size="xs" square>
          <UIcon name="lucide:bookmark" class="h-4 w-4" />
        </UButton>
      </div> -->
    </div>
  </article>
</template>
