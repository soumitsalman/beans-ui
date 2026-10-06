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
      class="space-y-3 beans-surface rounded-lg border border-stone-800/90 bg-stone-900/50 p-3.5 sm:p-4"
      @submit="find"
    >
      <div class="flex items-start gap-2">
        <UFormField
          name="query"
          class="min-w-0 flex-1"
        >
          <UInput
            v-model="search_form.query"
            class="w-full"
            placeholder="What's on your mind?"
            icon="lucide:search"
            size="lg"
            autocomplete="off"
            aria-label="Search query"
            :ui="{ base: 'pe-11', trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                type="button"
                icon="lucide:x"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                class="size-8 justify-center"
                aria-label="Clear search"
                :disabled="!can_clear"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </UFormField>
        <UButton
          type="submit"
          icon="lucide:search"
          color="primary"
          size="lg"
          class="size-9 shrink-0 justify-center md:w-auto"
          aria-label="Find"
          :loading="searching"
        >
          <span class="hidden md:inline">Find</span>
        </UButton>
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
