<script setup lang="ts">
import type { Bean, Publisher } from '~/types/beans'

const props = defineProps<{
  bean: Bean
  publisher?: Publisher
}>()

const site_name = computed(() => props.publisher?.source_site_name || props.bean.source)
const favicon = computed(() => props.publisher?.source_favicon || `https://www.google.com/s2/favicons?sz=64&domain=${props.publisher?.source_base_url}`)
const published_at = useRelativeTime(props.bean.published_at)
const category = computed(() => props.bean.categories?.[0] || props.bean.regions?.[0] || 'Global')
const tag_item = computed(() => props.bean.entities?.[0] || props.bean.regions?.[0] || undefined)
</script>

<template>
  <article class="group overflow-hidden rounded-[24px] bg-transparent transition-transform duration-300 hover:-translate-y-0.5">
    <div class="flex gap-4 p-2 sm:p-3">
      <div
        v-if="bean.image_url"
        class="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] sm:h-28 sm:w-28"
      >
        <a
          :href="bean.url"
          target="_blank"
          rel="noopener noreferrer"
          class="block h-full w-full"
        >
          <img
            :src="bean.image_url"
            :alt="bean.title"
            class="h-full w-full object-cover grayscale opacity-70 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950/35 to-transparent" />
        </a>
      </div>

      <div class="min-w-0 flex-1 space-y-2 gap-2">
        <div class="flex flex-wrap items-center gap-2 w-full justify-between">
          <div class="flex items-center gap-2">
            <UBadge :label="category" color="primary" variant="solid" size="xs" class="uppercase font-bold"/>
            <UBadge v-if="tag_item" :label="tag_item" color="secondary" variant="soft" size="xs" class="uppercase font-bold"/>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{{ published_at }}</span>
        </div>

        <h3 class="line-clamp-2 font-bold leading-5 text-on-surface group-hover:text-primary transition-colors sm:text-base">
          <a :href="bean.url" target="_blank" rel="noopener noreferrer" class="block hover:text-primary">
            {{ bean.title }}
          </a>
        </h3>

        <div class="flex flex-wrap items-center gap-2 w-full justify-between">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant sm:text-[11px]">
            <img v-if="favicon" :src="favicon" class="h-3 w-3 rounded-full">
            {{ site_name }}
          </span>

          <div class="flex items-center gap-2">
            <UButton icon="lucide:thumbs-up" color="secondary" variant="ghost" size="xs" square/>
            <UButton icon="lucide:share-2" color="secondary" variant="ghost" size="xs"square/>
            <UButton icon="lucide:bookmark" color="secondary" variant="ghost" size="xs" square/>
          </div>
        </div>
      </div>
    </div>

  </article>
</template>
