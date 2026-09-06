<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NewsStory } from '~/types/news'
import StoryCard from '~/components/news/StoryCard.vue'

type StorySectionMode = 'compressed' | 'snapshot' | 'detailed'
type StorySectionVariant = 'list' | 'carousel'

interface StorySectionProps {
  title: string
  eyebrow?: string
  stories: NewsStory[]
  mode: StorySectionMode
  loading: boolean
  can_load_more: boolean
  error_message?: string | null
  empty_message?: string
  variant?: StorySectionVariant
}

const props = withDefaults(defineProps<StorySectionProps>(), {
  variant: 'list',
  empty_message: 'Nothing is available yet.'
})

const emit = defineEmits<{
  'load-more': []
  'retry': []
}>()

const is_carousel = computed(() => props.variant === 'carousel')
const skeleton_count = computed(() => is_carousel.value ? 2 : 3)
const carousel_ref = ref<{
  emblaApi?: {
    value?: {
      canScrollNext: () => boolean
    }
  }
}>()
const CAROUSEL_UI = {
  viewport: '-mx-4 px-4 sm:mx-0 sm:px-0',
  item: 'basis-[18rem] sm:basis-[21rem]'
}

function emitLoadMore() {
  emit('load-more')
}

function handleCarouselSelect(index: number) {
  if (!is_carousel.value || props.loading || !props.can_load_more) return

  const load_threshold = Math.max(0, props.stories.length - 1)
  const _embla_api = carousel_ref.value?.emblaApi?.value
  const at_end = _embla_api ? !_embla_api.canScrollNext() : index >= load_threshold
  if (at_end || index >= load_threshold) emitLoadMore()
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-end justify-between gap-4 px-1">
      <div class="min-w-0">
        <p
          v-if="eyebrow"
          class="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-500/80"
        >
          {{ eyebrow }}
        </p>
        <h2 class="truncate text-base font-semibold text-stone-100 sm:text-lg">
          {{ title }}
        </h2>
      </div>

      <UButton
        v-if="can_load_more"
        label="Load more"
        icon="lucide:plus"
        color="neutral"
        variant="ghost"
        size="sm"
        class="shrink-0"
        :loading="loading"
        @click="emitLoadMore"
      />
    </div>

    <UAlert
      v-if="error_message"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="error_message"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          :loading="loading"
          @click="emit('retry')"
        />
      </template>
    </UAlert>

    <UCarousel
      v-if="stories.length && is_carousel"
      ref="carousel_ref"
      :items="stories"
      :arrows="stories.length > 1"
      :ui="CAROUSEL_UI"
      @select="handleCarouselSelect"
    >
      <template #default="{ item }">
        <StoryCard
          :story="item"
          :mode="mode"
        />
      </template>
    </UCarousel>
    <div
      v-else-if="stories.length"
      class="space-y-3"
    >
      <StoryCard
        v-for="story in stories"
        :key="story.id"
        :story="story"
        :mode="mode"
        class="w-full"
      />
    </div>

    <div
      v-else-if="loading"
      :class="is_carousel ? '-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0' : 'space-y-3'"
    >
      <div
        v-for="index in skeleton_count"
        :key="index"
        :class="is_carousel ? 'w-[18rem] shrink-0 sm:w-[21rem]' : 'w-full'"
        class="rounded-lg border border-stone-800/80 bg-stone-900/50 p-3.5"
      >
        <div class="flex gap-3">
          <USkeleton class="size-24 shrink-0 rounded-md bg-stone-800" />
          <div class="min-w-0 flex-1 space-y-3">
            <USkeleton class="h-3 w-1/3 bg-stone-800" />
            <USkeleton class="h-4 w-full bg-stone-800" />
            <USkeleton class="h-4 w-4/5 bg-stone-800" />
            <USkeleton class="h-3 w-2/5 bg-stone-800" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-stone-800 px-4 text-center text-sm text-stone-500"
    >
      <UIcon
        name="lucide:inbox"
        class="size-5"
        aria-hidden="true"
      />
      <span>{{ empty_message }}</span>
    </div>
  </section>
</template>
