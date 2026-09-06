<script setup lang="ts">
import { reactive } from 'vue'
import StorySection from '~/components/news/StorySection.vue'
import { sourceLabel } from '~/utils/source'

const search_form = reactive({
  query: '',
  tags: '',
  source_query: ''
})

const {
  results,
  source_matches,
  loading,
  loading_sources,
  error_message,
  empty_message,
  empty_publisher_lookup,
  has_searched,
  can_load_more,
  search,
  loadMore,
  retrySearch
} = useSearchFeed()

function sourceName(source: typeof source_matches.value[number]): string {
  return sourceLabel({ source }) || source.id || 'Publisher'
}

function submitSearch(): void {
  void search(search_form)
}

useSeoMeta({
  title: 'Search | Beans',
  description: 'Search current news by topic, normalized tag, or publisher source.'
})
</script>

<template>
  <div class="space-y-7">
    <div class="max-w-2xl space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/70">
        Discovery
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        Search the news
      </h1>
      <p class="text-sm leading-6 text-stone-400">
        Look for a topic, normalized tag, or publisher without mixing those filters together.
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

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField
          label="Tags"
          name="tags"
          hint="Comma separated"
        >
          <UInput
            v-model="search_form.tags"
            placeholder="machine learning, startups"
            icon="lucide:tags"
            autocomplete="off"
          />
        </UFormField>
        <UFormField
          label="Publisher source"
          name="source_query"
          hint="Matches publisher names and domains"
        >
          <UInput
            v-model="search_form.source_query"
            placeholder="Cafecito"
            icon="lucide:radio"
            :loading="loading_sources"
            autocomplete="off"
          />
        </UFormField>
      </div>

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

    <div
      v-if="source_matches.length"
      class="flex flex-wrap items-center gap-2 px-1 text-xs text-stone-500"
    >
      <span>Publisher filter:</span>
      <UBadge
        v-for="source in source_matches"
        :key="source.id || sourceName(source)"
        color="neutral"
        variant="soft"
        class="max-w-48 truncate bg-stone-800/80 text-stone-300"
      >
        {{ sourceName(source) }}
      </UBadge>
    </div>

    <UAlert
      v-if="empty_publisher_lookup && !loading && !error_message"
      color="neutral"
      variant="subtle"
      icon="lucide:radio"
      :title="empty_message"
      description="Try a different publisher name or domain. News search did not run with an unmatched source."
    >
      <template #actions>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          size="xs"
          @click="retrySearch"
        />
      </template>
    </UAlert>
    <StorySection
      v-else-if="has_searched"
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
