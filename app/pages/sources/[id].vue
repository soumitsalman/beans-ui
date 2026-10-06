<script setup lang="ts">
import { computed, ref } from 'vue'
import ArticleSection from '~/components/news/ArticleSection.vue'
import type { NewsSource } from '~/types/news'
import { DEFAULT_SOURCE_ICON, sourceFavicon, sourceLabel } from '~/utils/source'
import { resourceError } from '~/utils/resourceError'

const route = useRoute()
const source_id = computed(() => String(route.params.id || ''))
const source = ref<NewsSource | null>(null)
const loading_source = ref(false)
const source_error = ref<string | null>(null)
const { fetchSource } = useBeansApi()
const { outboundHref } = useOutboundUrl()
const {
  articles,
  loading,
  can_load_more,
  error_message,
  initialiseFeed,
  refreshFeed,
  loadMore,
  retryFeed
} = useNewsFeed(undefined, source_id)
let _generation = 0

const source_name = computed(() => sourceLabel({ source: source.value, url: source.value?.url }) || 'Source')
const source_url = computed(() => normaliseSourceUrl(source.value?.base_url || source.value?.url))
const source_display_url = computed(() => source_url.value?.replace(/^https?:\/\//i, ''))

function normaliseSourceUrl(value?: string | null): string | undefined {
  const url = value?.trim()
  if (!url) return undefined
  if (url.startsWith('//')) return `https:${url}`
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

usePageMetadata(() => ({
  ready: Boolean(source.value || source_error.value),
  title: `${source_name.value} news | Beans`,
  description: source.value?.description || `Latest news from ${source_name.value}. Compare original reporting and related coverage on Beans.`,
  kind: 'CollectionPage',
  breadcrumbs: [{ name: 'Beans', path: '/' }, { name: source_name.value, path: route.path }]
}))
useSeoMeta({ robots: () => source_error.value ? 'noindex, follow' : 'index, follow, max-image-preview:large' })

async function loadSource(): Promise<void> {
  const generation = ++_generation
  const id = source_id.value
  source.value = null
  source_error.value = null
  loading_source.value = true
  try {
    const result = await fetchSource(id)
    if (!result.id) throw createError({ statusCode: 404, statusMessage: 'Source not found.' })
    if (generation !== _generation) return
    source.value = result
  } catch (error) {
    if (generation === _generation) {
      const failure = resourceError(error)
      if (failure.statusCode !== 503) showError(failure)
      source_error.value = failure.statusMessage
    }
  } finally {
    if (generation === _generation) {
      loading_source.value = false
      if (import.meta.client && source.value) void refreshFeed()
    }
  }
}

const { data: initial_source, error: initial_error } = await useAsyncData(`source:${source_id.value}`, async () => {
  const result = await fetchSource(source_id.value)
  if (!result.id) throw createError({ statusCode: 404, statusMessage: 'Source not found.' })
  return result
})
source.value = initial_source.value ?? null
if (initial_error.value) {
  const failure = resourceError(initial_error.value)
  if (failure.statusCode !== 503) throw createError(failure)
  if (import.meta.server) setResponseStatus(useRequestEvent()!, 503)
  source_error.value = failure.statusMessage
}
if (source.value) await initialiseFeed()
</script>

<template>
  <div class="space-y-7">
    <USkeleton
      v-if="loading_source"
      class="h-36 rounded-lg bg-stone-800"
    />
    <UAlert
      v-else-if="source_error"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="source_error"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          @click="loadSource"
        />
      </template>
    </UAlert>
    <article
      v-else-if="source"
      class="mt-10 beans-surface rounded-lg border border-stone-800/90 bg-stone-900/60 sm:mt-12"
    >
      <div class="px-4 pb-5 sm:px-5">
        <UAvatar
          :src="sourceFavicon({ source, url: source.url })"
          :alt="source_name"
          :icon="DEFAULT_SOURCE_ICON"
          size="xl"
          class="-mt-10 size-20 ring-4 ring-stone-950 sm:-mt-12 sm:size-24"
          loading="eager"
          referrerpolicy="no-referrer"
        />
        <div class="mt-3 min-w-0">
          <h1 class="text-xl font-semibold text-stone-100 sm:text-2xl">
            {{ source_name }}
          </h1>
          <p
            v-if="source.description"
            class="mt-3 max-w-3xl text-sm leading-6 text-stone-400"
          >
            {{ source.description }}
          </p>
          <a
            v-if="source_url"
            data-publisher-link
            :href="outboundHref(source_url)"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex max-w-full items-center gap-1.5 break-all text-sm text-primary hover:underline"
          >
            <UIcon
              name="lucide:link"
              class="size-3.5 shrink-0"
              aria-hidden="true"
            />
            {{ source_display_url }}
          </a>
        </div>
      </div>
    </article>

    <USeparator v-if="source && !loading_source" />

    <ArticleSection
      v-if="source && !loading_source"
      wide_grid
      :articles="articles"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      empty_message="No recent news is available for this source."
      @load-more="loadMore"
      @retry="retryFeed"
    />
  </div>
</template>
