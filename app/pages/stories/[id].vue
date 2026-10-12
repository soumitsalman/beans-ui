<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ArticleDetailSections from '~/components/news/ArticleDetailSections.vue'
import ArticleSnapshot from '~/components/news/ArticleSnapshot.vue'
import type { NewsArticle } from '~/types/news'
import { resourceError, requestErrorMessage } from '~/utils/resourceError'

const route = useRoute()
const { action_blocked, cooldown_message } = useActionCooldown()
const { fetchStory, fetchCoverage, fetchRelated } = useBeansApi()
const article_id = computed(() => String(route.params.id || ''))
const { data: initial_article, error: initial_error } = await useAsyncData(`story:${article_id.value}`, async () => {
  const result = await fetchStory(article_id.value)
  if (!result.story.id || !result.story.title) throw createError({ statusCode: 404, statusMessage: 'Story not found.' })
  return result
})
const article = ref<NewsArticle | null>(initial_article.value?.story ?? null)
const coverage_articles = ref<NewsArticle[]>(initial_article.value?.coverage.data ?? [])
const related_articles = ref<NewsArticle[]>(initial_article.value?.related.data ?? [])
const coverage_cursor = ref<string | null>(null)
const related_cursor = ref<string | null>(initial_article.value?.related.next_cursor ?? null)
const loading_article = ref(false)
const loading_coverage = ref(false)
const loading_related = ref(false)
const article_error = ref<string | null>(null)
const coverage_error = ref<string | null>(initial_article.value?.coverage_error ?? null)
const related_error = ref<string | null>(initial_article.value?.related_error ?? null)
const can_load_more_related = computed(() => Boolean(related_cursor.value))
let _request_generation = 0
let _coverage_exhausted = Boolean(initial_article.value && !initial_article.value.coverage_error)

if (initial_error.value) {
  const failure = resourceError(initial_error.value)
  if (failure.statusCode !== 503 && failure.statusCode !== 429) throw createError(failure)
  if (import.meta.server) setResponseStatus(useRequestEvent()!, failure.statusCode)
  article_error.value = failure.statusMessage
}

useSeoMeta({ robots: () => article_error.value ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
usePageMetadata(() => ({
  kind: 'WebPage',
  title: article.value ? `${article.value.title} | Beans coverage` : 'Story temporarily unavailable | Beans',
  description: article.value?.summary || 'Compare publisher reporting and explore related coverage of this story on Beans.',
  image: article.value?.image_url,
  breadcrumbs: [{ name: 'Beans', path: '/' }, { name: article.value?.title || 'Story', path: route.path }]
}))

const { trackEvent } = useGoogleAnalytics()

function isCurrentGeneration(generation: number): boolean {
  return generation === _request_generation
}

function appendUnique(target: NewsArticle[], received: NewsArticle[]): NewsArticle[] {
  const known_ids = new Set(target.map(item => item.id || item.url).filter(Boolean))
  const fresh = received.filter((item) => {
    const key = item.id || item.url
    if (!key || known_ids.has(key)) return false
    known_ids.add(key)
    return true
  })
  return [...target, ...fresh]
}

async function loadCoverage(generation = _request_generation): Promise<void> {
  if (!isCurrentGeneration(generation) || !article.value?.story_id || loading_coverage.value || _coverage_exhausted) return

  loading_coverage.value = true
  coverage_error.value = null
  try {
    const page = await fetchCoverage(article.value.story_id)
    if (!isCurrentGeneration(generation)) return
    coverage_articles.value = page.data
    _coverage_exhausted = true
  } catch (error) {
    if (isCurrentGeneration(generation)) coverage_error.value = requestErrorMessage(error, 'Coverage could not be loaded right now.')
  } finally {
    if (isCurrentGeneration(generation)) loading_coverage.value = false
  }
}

async function loadRelated(append = false, generation = _request_generation): Promise<void> {
  if (!isCurrentGeneration(generation) || !article.value?.story_id || loading_related.value) return
  if (append && !related_cursor.value) return

  loading_related.value = true
  related_error.value = null
  const cursor = append ? related_cursor.value : null
  try {
    const page = await fetchRelated(article.value.story_id, cursor)
    if (!isCurrentGeneration(generation)) return

    related_articles.value = append
      ? appendUnique(related_articles.value, page.data)
      : appendUnique([], page.data)
    related_cursor.value = page.next_cursor && page.next_cursor !== cursor
      ? page.next_cursor
      : null
  } catch (error) {
    if (isCurrentGeneration(generation)) related_error.value = requestErrorMessage(error, 'Related articles could not be loaded right now.')
  } finally {
    if (isCurrentGeneration(generation)) loading_related.value = false
  }
}

async function loadArticle(): Promise<void> {
  const generation = ++_request_generation
  const id = article_id.value
  loading_article.value = true
  article_error.value = null
  article.value = null
  coverage_articles.value = []
  related_articles.value = []
  coverage_cursor.value = null
  related_cursor.value = null
  _coverage_exhausted = false
  coverage_error.value = null
  related_error.value = null

  try {
    const result = await fetchStory(id)
    if (!isCurrentGeneration(generation)) return
    if (!result.story.id || !result.story.title) throw createError({ statusCode: 404, statusMessage: 'Story not found.' })
    article.value = result.story
    coverage_articles.value = result.coverage.data
    related_articles.value = result.related.data
    related_cursor.value = result.related.next_cursor
    coverage_error.value = result.coverage_error
    related_error.value = result.related_error
    _coverage_exhausted = !result.coverage_error
    loading_article.value = false
  } catch (error) {
    if (isCurrentGeneration(generation)) {
      const failure = resourceError(error)
      if (failure.statusCode !== 503 && failure.statusCode !== 429) showError(failure)
      article_error.value = failure.statusMessage
      loading_article.value = false
    }
  }
}

onMounted(() => {
  if (article.value) {
    trackEvent('coverage_open', { article_id: article.value.id })
  }
})
</script>

<template>
  <div class="space-y-7">
    <USkeleton
      v-if="loading_article"
      class="h-56 rounded-lg bg-stone-800"
    />
    <UAlert
      v-else-if="article_error"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="cooldown_message || article_error"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          :disabled="loading_article || action_blocked"
          @click="loadArticle"
        />
      </template>
    </UAlert>

    <template v-else-if="article">
      <ArticleSnapshot
        :article="article"
        story
      />
      <ArticleDetailSections
        :coverage_articles="coverage_articles"
        :related_articles="related_articles"
        :loading_coverage="loading_coverage"
        :loading_related="loading_related"
        :can_load_more_related="can_load_more_related"
        :coverage_error="coverage_error"
        :related_error="related_error"
        @retry-coverage="loadCoverage"
        @retry-related="() => loadRelated(Boolean(related_articles.length))"
        @load-more-related="() => loadRelated(true)"
      />
    </template>
  </div>
</template>
