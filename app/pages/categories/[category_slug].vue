<script setup lang="ts">
import { computed } from 'vue'
import ArticleSection from '~/components/news/ArticleSection.vue'
import { findCategory } from '~/settings/categories'

const route = useRoute()
const category = computed(() => findCategory(String(route.params.category_slug)))

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown category.' })
}

const {
  articles,
  loading,
  can_load_more,
  error_message,
  initialiseFeed,
  loadMore,
  retryFeed
} = useNewsFeed(category)

usePageMetadata(() => ({
  title: `${category.value?.label || 'Category'} news | Beans`,
  description: category.value?.description || 'A focused news category.',
  kind: 'CollectionPage',
  breadcrumbs: [{ name: 'Beans', path: '/' }, { name: category.value?.label || 'Category', path: route.path }]
}))

await initialiseFeed()
if (import.meta.server && error_message.value && !articles.value.length) setResponseStatus(useRequestEvent()!, 503)
useSeoMeta({ robots: () => error_message.value && !articles.value.length ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
</script>

<template>
  <div class="space-y-6">
    <div class="max-w-2xl space-y-2 px-1">
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        {{ category?.label }}
      </h1>
      <p class="text-sm leading-6 text-stone-400">
        {{ category?.description }}
      </p>
    </div>

    <ArticleSection
      :articles="articles"
      :loading="loading"
      :can_load_more="can_load_more"
      :error_message="error_message"
      :empty_message="`No news is available in ${category?.label || 'this category'} right now.`"
      @load-more="loadMore"
      @retry="retryFeed"
    />
  </div>
</template>
