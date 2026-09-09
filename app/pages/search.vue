<script setup lang="ts">
import { reactive, watch } from 'vue'
import StorySection from '~/components/news/StorySection.vue'
import { SEARCH_TAG_DELIMITER, normaliseTagInput, normaliseTagValue } from '~/utils/formatters'
import { searchCriteriaFromQuery, toSearchRouteQuery } from '~/utils/searchQuery'

const route = useRoute()
const router = useRouter()

const search_form = reactive({
  query: '',
  tags: [] as string[]
})

const {
  results,
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

function applyCriteriaToForm(query: string, tags: string[]): void {
  search_form.query = query
  search_form.tags = tags
}

async function writeSearchRoute(query: string, tags: string[]): Promise<void> {
  const next_query = toSearchRouteQuery({ query, tags })
  _syncing_route = true
  await router.replace({ query: next_query })
  _syncing_route = false
}

async function submitSearch(): Promise<void> {
  const query = search_form.query.trim()
  const tags = normaliseTagInput(search_form.tags)
  applyCriteriaToForm(query, tags)
  await writeSearchRoute(query, tags)
  void search({ query, tags })
}

watch(
  () => {
    const { query, tags } = searchCriteriaFromQuery(route.query)
    return `${query}\0${tags.join(',')}\0${route.query.sources == null ? '0' : '1'}`
  },
  () => {
    if (_syncing_route) return

    const { query, tags } = searchCriteriaFromQuery(route.query)
    applyCriteriaToForm(query, tags)
    if (route.query.sources != null) void writeSearchRoute(query, tags)
    if (query || tags.length) void search({ query, tags })
  },
  { immediate: true }
)

useSeoMeta({
  title: 'Search | Beans',
  description: 'Search current news by topic or normalized tag.'
})
</script>

<template>
  <div class="space-y-7">
    <div class="max-w-2xl space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
        Discovery
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        Search the news
      </h1>
      <p class="text-sm leading-6 text-stone-400">
        Look for a topic or normalized tags without mixing those filters together.
      </p>
    </div>

    <UForm
      :state="search_form"
      class="space-y-3 rounded-lg border border-stone-800/90 bg-stone-900/50 p-3.5 sm:p-4"
      @submit="submitSearch"
    >
      <UFormField
        label="Topic"
        name="query"
      >
        <UInput
          v-model="search_form.query"
          placeholder="Semantic search, for example: battery manufacturing"
          icon="lucide:search"
          size="lg"
          autocomplete="off"
        />
      </UFormField>

      <UFormField
        label="Tags"
        name="tags"
        hint="Press Space to add a tag"
      >
        <UInputTags
          v-model="search_form.tags"
          class="w-full"
          placeholder="machine_learning startups"
          icon="lucide:tags"
          size="lg"
          :delimiter="SEARCH_TAG_DELIMITER"
          :convert-value="normaliseTagValue"
          add-on-blur
          add-on-paste
          add-on-tab
          autocomplete="off"
        />
      </UFormField>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p class="text-xs leading-5 text-stone-500">
          Results are limited to published news and load five at a time.
        </p>
        <UButton
          type="submit"
          label="Search"
          icon="lucide:search"
          color="primary"
          :loading="loading"
        />
      </div>
    </UForm>

    <StorySection
      v-if="has_searched"
      title="Search results"
      eyebrow="News only"
      :stories="results"
      mode="snapshot"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      :empty_message="empty_message"
      @load-more="loadMore"
      @retry="retrySearch"
    />
  </div>
</template>
