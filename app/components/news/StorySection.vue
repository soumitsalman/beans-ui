<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { NewsStory } from '~/types/news'
import StoryCard from '~/components/news/StoryCard.vue'

type StorySectionMode = 'compressed' | 'snapshot' | 'detailed'
type StorySectionVariant = 'list' | 'carousel'
type CarouselApi = {
  canScrollNext: () => boolean
  selectedScrollSnap?: () => number
  scrollSnapList?: () => number[]
  slideNodes?: () => ArrayLike<unknown>
  scrollTo?: (index: number, jump?: boolean) => void
  on?: (event: string, callback: () => void) => void
  off?: (event: string, callback: () => void) => void
}

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
const has_stories = computed(() => props.stories.length > 0)
const show_empty = computed(() => !has_stories.value && !props.loading && !props.error_message)
const SKELETON_COUNT = 2
const carousel_ref = ref<{
  emblaApi?: CarouselApi | { value?: CarouselApi }
}>()
const CAROUSEL_SLIDE_BASIS_CLASS = 'basis-full md:ps-0 md:px-1.5 md:basis-1/2'
const LATEST_NEWS_GRID_CLASS = 'grid grid-cols-1 items-start gap-3 md:grid-cols-2'
const CAROUSEL_UI = {
  container: 'md:ms-0',
  item: CAROUSEL_SLIDE_BASIS_CLASS,
  prev: 'start-1 top-20 sm:start-1 sm:top-1/2',
  next: 'end-1 top-20 sm:end-1 sm:top-1/2'
}
const MAX_CAROUSEL_BIND_ATTEMPTS = 12
const selected_index = ref(0)
const can_scroll_next = ref(true)
let _bound_api: CarouselApi | undefined
let _on_carousel_select: (() => void) | undefined
let _bind_attempts = 0
let _snap_to_restore: number | null = null
let _is_mounted = true
let _awaiting_page = false
const LOAD_MORE_COOLDOWN_MS = 400
let _last_load_more_at = 0

function emitLoadMore() {
  const now = Date.now()
  if (_awaiting_page || now - _last_load_more_at < LOAD_MORE_COOLDOWN_MS) {
    return
  }
  _awaiting_page = true
  _last_load_more_at = now
  emit('load-more')
}

function unwrapCarouselApi(value: unknown): CarouselApi | undefined {
  if (!value || typeof value !== 'object') return undefined

  const _direct = value as CarouselApi
  if (typeof _direct.canScrollNext === 'function') return _direct

  const _nested = (value as { value?: CarouselApi }).value
  return typeof _nested?.canScrollNext === 'function' ? _nested : undefined
}

function exposedCarouselApi(): CarouselApi | undefined {
  return unwrapCarouselApi(carousel_ref.value?.emblaApi)
}

function syncCarouselState(api?: CarouselApi) {
  if (!api) return

  if (typeof api.selectedScrollSnap === 'function') {
    selected_index.value = api.selectedScrollSnap()
  }

  can_scroll_next.value = api.canScrollNext()
}

function isAtLastLoadedItem(api?: CarouselApi): boolean {
  const last_item_index = props.stories.length - 1
  if (last_item_index < 0) return false

  if (api) {
    if (!api.canScrollNext()) return true
    if (typeof api.scrollSnapList === 'function' && typeof api.selectedScrollSnap === 'function') {
      const snap_count = api.scrollSnapList().length
      if (snap_count && api.selectedScrollSnap() >= snap_count - 1) return true
    }
  }

  return selected_index.value >= last_item_index
}

function maybeLoadMore() {
  const api = exposedCarouselApi()
  const slide_count = api?.slideNodes?.()?.length ?? null
  const at_last = isAtLastLoadedItem(api)
  if (!is_carousel.value
    || props.loading
    || !props.can_load_more
    || props.error_message
    || _snap_to_restore != null
    || (slide_count != null && slide_count < props.stories.length)
    || !at_last) return

  emitLoadMore()
}

function unbindCarousel() {
  if (_bound_api && _on_carousel_select) {
    _bound_api.off?.('select', _on_carousel_select)
    _bound_api.off?.('settle', _on_carousel_select)
    _bound_api.off?.('reInit', _on_carousel_select)
  }

  _bound_api = undefined
  _on_carousel_select = undefined
}

function bindCarousel() {
  if (!_is_mounted) return
  if (!is_carousel.value || !has_stories.value) {
    unbindCarousel()
    _bind_attempts = 0
    return
  }

  const api = exposedCarouselApi()
  if (!api) {
    if (_bind_attempts < MAX_CAROUSEL_BIND_ATTEMPTS) {
      _bind_attempts += 1
      requestAnimationFrame(bindCarousel)
    }
    return
  }

  _bind_attempts = 0
  if (_bound_api === api) {
    syncCarouselState(api)
    maybeLoadMore()
    return
  }

  unbindCarousel()
  const on_select = () => {
    syncCarouselState(api)
    maybeLoadMore()
  }

  api.on?.('select', on_select)
  api.on?.('settle', on_select)
  api.on?.('reInit', on_select)
  _bound_api = api
  _on_carousel_select = on_select
  on_select()
}

function restoreCarouselSnap() {
  if (_snap_to_restore == null) return

  const api = exposedCarouselApi()
  const target = Math.min(_snap_to_restore, Math.max(0, props.stories.length - 1))
  api?.scrollTo?.(target, true)
  selected_index.value = target
  _snap_to_restore = null
  syncCarouselState(api)
}

function handleCarouselSelect(index: number) {
  selected_index.value = index
  const api = exposedCarouselApi()
  can_scroll_next.value = api
    ? api.canScrollNext()
    : index < Math.max(0, props.stories.length - 1)
  maybeLoadMore()
}

function handleCarouselNext() {
  const api = exposedCarouselApi()
  const can_next = api?.canScrollNext() ?? can_scroll_next.value
  if (props.error_message || props.loading) return
  if (can_next) return
  if (props.can_load_more) emitLoadMore()
}

const carousel_next_props = computed(() => ({
  disabled: Boolean(props.error_message) || (!can_scroll_next.value && !props.can_load_more),
  loading: Boolean(props.loading && props.can_load_more),
  onClick: handleCarouselNext
}))

watch(
  () => props.stories.length,
  (length, previous_length) => {
    if (!is_carousel.value) return

    if (previous_length && length > previous_length) {
      _snap_to_restore = selected_index.value
    }
    void nextTick(() => {
      bindCarousel()
      restoreCarouselSnap()
      maybeLoadMore()
    })
  }
)

watch(
  () => [carousel_ref.value, is_carousel.value, has_stories.value] as const,
  () => {
    void nextTick(bindCarousel)
  },
  { flush: 'post' }
)

watch(
  () => [props.loading, props.can_load_more, props.error_message] as const,
  ([loading, , error_message]) => {
    if (error_message) {
      _awaiting_page = true
      return
    }
    if (loading) {
      _awaiting_page = true
      return
    }
    _awaiting_page = false
    void nextTick(() => maybeLoadMore())
  }
)

onBeforeUnmount(() => {
  _is_mounted = false
  unbindCarousel()
})
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-end justify-between gap-4 px-1">
      <div class="min-w-0">
        <p
          v-if="eyebrow"
          class="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80"
        >
          {{ eyebrow }}
        </p>
        <h2 class="truncate text-base font-semibold text-stone-100 sm:text-lg">
          {{ title }}
        </h2>
      </div>
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

    <template v-if="has_stories">
      <UCarousel
        v-if="is_carousel"
        ref="carousel_ref"
        :items="stories"
        :arrows="stories.length > 1 || can_load_more"
        :next="carousel_next_props"
        align="start"
        :slides-to-scroll="1"
        :ui="CAROUSEL_UI"
        class="w-full"
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
        v-else
        :class="LATEST_NEWS_GRID_CLASS"
      >
        <StoryCard
          v-for="story in stories"
          :key="story.id"
          :story="story"
          :mode="mode"
          class="min-w-0 w-full"
        />
      </div>

      <div
        v-if="can_load_more && !is_carousel"
        class="flex justify-center pt-1"
      >
        <UButton
          label="More"
          icon="lucide:plus"
          color="neutral"
          variant="soft"
          :loading="loading"
          @click="emitLoadMore"
        />
      </div>
    </template>

    <div
      v-else-if="loading && is_carousel"
      class="overflow-hidden"
    >
      <div class="-ms-4 flex items-start md:ms-0">
        <div
          v-for="index in SKELETON_COUNT"
          :key="index"
          class="min-w-0 shrink-0 ps-4 md:ps-0"
          :class="CAROUSEL_SLIDE_BASIS_CLASS"
        >
          <div class="overflow-hidden rounded-lg border border-stone-800/80 bg-stone-900/50">
            <div class="space-y-3">
              <USkeleton class="aspect-[16/9] w-full rounded-none bg-stone-800" />
              <div class="space-y-3 p-3.5">
                <USkeleton class="h-3 w-1/3 bg-stone-800" />
                <USkeleton class="h-4 w-full bg-stone-800" />
                <USkeleton class="h-4 w-4/5 bg-stone-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="loading"
      :class="LATEST_NEWS_GRID_CLASS"
    >
      <div
        v-for="index in SKELETON_COUNT"
        :key="index"
        class="min-w-0 w-full overflow-hidden rounded-lg border border-stone-800/80 bg-stone-900/50 p-3.5"
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
      v-else-if="show_empty"
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
