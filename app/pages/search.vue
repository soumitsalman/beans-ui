<script setup lang="ts">
import { reactive, watch } from 'vue'
import ArticleSection from '~/components/news/ArticleSection.vue'
import { normaliseTagInput } from '~/utils/formatters'
import { searchCriteriaFromQuery, toSearchRouteQuery } from '~/utils/searchQuery'

const route = useRoute()
const router = useRouter()
const { trackEvent } = useGoogleAnalytics()

const search_form = reactive({
  query: '',
  tags: '',
  sources: ''
})

const {
  articles,
  loading,
  error_message,
  empty_message,
  has_searched,
  can_load_more,
  search,
  loadMore,
  retrySearch
} = useSearchFeed()

let _syncing_route = false

function applyCriteriaToForm(query: string, tags: string[], sources: string[]): void {
  search_form.query = query
  search_form.tags = tags.join(', ')
  search_form.sources = sources.join(', ')
}

async function writeSearchRoute(query: string, tags: string[], sources: string[]): Promise<void> {
  const next_query = toSearchRouteQuery({ query, tags, sources })
  _syncing_route = true
  await router.replace({ query: next_query })
  _syncing_route = false
}

async function submitSearch(): Promise<void> {
  const query = search_form.query.trim()
  const tags = normaliseTagInput(search_form.tags)
  const { sources } = searchCriteriaFromQuery({ sources: search_form.sources })
  applyCriteriaToForm(query, tags, sources)
  trackEvent('search_submit', { has_topic: Boolean(query), tag_count: tags.length, source_count: sources.length })
  await writeSearchRoute(query, tags, sources)
  void search({ query, tags, sources })
}

watch(
  () => {
    const { query, tags, sources } = searchCriteriaFromQuery(route.query)
    return `${query}\0${tags.join(',')}\0${sources.join(',')}`
  },
  () => {
    if (_syncing_route) return

    const { query, tags, sources } = searchCriteriaFromQuery(route.query)
    applyCriteriaToForm(query, tags, sources)
    if (query || tags.length || sources.length) void search({ query, tags, sources })
  },
  { immediate: true }
)

usePageMetadata({
  title: 'Search | Beans',
  description: 'Search current news by topic or normalized tag.'
})
useSeoMeta({ robots: 'noindex, follow' })
</script>

<template>
  <div class="space-y-7">
    <div class="max-w-2xl space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
        Discover News
      </p>
    </div>

    <UForm
      :state="search_form"
      class="space-y-3 beans-surface rounded-lg border border-stone-800/90 bg-stone-900/50 p-3.5 sm:p-4"
      @submit="submitSearch"
    >
      <UFormField
        name="query"
      >
        <UInput
          v-model="search_form.query"
          class="w-full"
          placeholder="What can we help you find today?"
          icon="lucide:search"
          size="lg"
          autocomplete="off"
        />
      </UFormField>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UFormField
          label="Tags"
          name="tags"
          class="min-w-0"
        >
          <UInput
            v-model="search_form.tags"
            class="w-full"
            placeholder="machine_learning, startups"
            icon="lucide:tags"
            size="lg"
            autocomplete="off"
          />
        </UFormField>
        <UFormField
          label="Sources"
          name="sources"
          class="min-w-0"
        >
          <UInput
            v-model="search_form.sources"
            class="w-full"
            placeholder="bbc, apnews"
            icon="lucide:globe"
            size="lg"
            autocomplete="off"
          />
        </UFormField>
      </div>

      <div class="flex justify-end pt-1">
        <UButton
          type="submit"
          label="Search"
          icon="lucide:search"
          color="primary"
          :loading="loading"
        />
      </div>
    </UForm>

    <ArticleSection
      v-if="has_searched"
      title="Search results"
      :articles="articles"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      :empty_message="empty_message"
      @load-more="loadMore"
      @retry="retrySearch"
    />
  </div>
</template>
