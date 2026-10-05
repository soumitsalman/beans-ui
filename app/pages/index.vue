<script setup lang="ts">
import ArticleSection from '~/components/news/ArticleSection.vue'

const {
  search_form,
  articles,
  loading,
  searching,
  can_load_more,
  can_clear,
  error_message,
  empty_message,
  find,
  clearSearch,
  loadMore,
  retry,
  start
} = useHomeDiscovery()

usePageMetadata({
  title: 'Beans | Trending news from publishers',
  description: 'See how different publishers cover the same story. Explore current news, related reporting and coverage timelines with Beans.',
  kind: 'CollectionPage'
})

await start()
if (import.meta.server && error_message.value && !articles.value.length) setResponseStatus(useRequestEvent()!, 503)
useSeoMeta({ robots: () => error_message.value && !articles.value.length ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
</script>

<template>
  <div class="space-y-6">
    <div class="max-w-2xl space-y-2 px-1">
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        Discover Trending News
      </h1>
    </div>

    <UForm
      :state="search_form"
      class="space-y-3 rounded-lg border border-stone-800/90 bg-stone-900/50 p-3.5 sm:p-4"
      @submit="find"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UFormField name="query">
          <UInput
            v-model="search_form.query"
            class="w-full"
            placeholder="What's on your mind?"
            icon="lucide:search"
            size="lg"
            autocomplete="off"
          />
        </UFormField>
        <UFormField name="tags">
          <UInput
            v-model="search_form.tags"
            class="w-full"
            placeholder="machine_learning, startups"
            icon="lucide:tags"
            size="lg"
            autocomplete="off"
            aria-label="Tags"
          />
        </UFormField>
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <UButton
          type="button"
          label="Clear"
          icon="lucide:x"
          color="neutral"
          variant="outline"
          :disabled="!can_clear"
          @click="clearSearch"
        />
        <UButton
          type="submit"
          label="Find"
          icon="lucide:search"
          color="primary"
          :loading="searching"
        />
      </div>
    </UForm>

    <USeparator />
    <ArticleSection
      wide_grid
      :articles="articles"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      :empty_message="empty_message"
      @load-more="loadMore"
      @retry="retry"
    />
  </div>
</template>
