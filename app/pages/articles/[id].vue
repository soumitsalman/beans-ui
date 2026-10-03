<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ArticleDetailSections from '~/components/news/ArticleDetailSections.vue'
import ArticleSnapshot from '~/components/news/ArticleSnapshot.vue'
import type { NewsArticle } from '~/types/news'
import { resourceError } from '~/utils/resourceError'

const COVERAGE_PAGE_SIZE = 100
const RELATED_PAGE_SIZE = 5
const route = useRoute()
const { fetchArticle, fetchStoryArticles } = useBeansApi()
const { fetchConfidence } = useEspressoApi()
const article_id = computed(() => String(route.params.id || ''))
const { data: initial_article, error: initial_error } = await useAsyncData(`article:${article_id.value}`, async () => {
  const result = await fetchArticle(article_id.value)
  if (!result.id || !result.title) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
  return result
})
const article = ref<NewsArticle | null>(initial_article.value ?? null)
const coverage_articles = ref<NewsArticle[]>([])
const related_articles = ref<NewsArticle[]>([])
const coverage_cursor = ref<string | null>(null)
const related_cursor = ref<string | null>(null)
const loading_article = ref(false)
const loading_coverage = ref(false)
const loading_related = ref(false)
const article_error = ref<string | null>(null)
const coverage_error = ref<string | null>(null)
const related_error = ref<string | null>(null)
const can_load_more_related = computed(() => Boolean(related_cursor.value))
let _request_generation = 0
let _coverage_exhausted = false

if (initial_error.value) {
  const failure = resourceError(initial_error.value)
  if (failure.statusCode !== 503) throw createError(failure)
  if (import.meta.server) setResponseStatus(useRequestEvent()!, 503)
  article_error.value = failure.statusMessage
}

useSeoMeta({ robots: () => article_error.value ? 'noindex, follow' : 'index, follow, max-image-preview:large' })
usePageMetadata(() => ({
  original_article: article.value,
  title: article.value ? `${article.value.title} | Beans coverage` : 'Article temporarily unavailable | Beans',
  description: article.value?.summary || 'Compare publisher reporting and explore related coverage of this story on Beans.',
  image: article.value?.image_url,
  breadcrumbs: [{ name: 'Beans', path: '/' }, { name: article.value?.title || 'Article', path: route.path }]
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
    let cursor = coverage_cursor.value
    while (isCurrentGeneration(generation) && !_coverage_exhausted) {
      const page = await fetchStoryArticles(article.value.story_id, {
        limit: COVERAGE_PAGE_SIZE,
        cursor: cursor ?? undefined
      })
      if (!isCurrentGeneration(generation)) return

      coverage_articles.value = appendUnique(coverage_articles.value, page.data)
      const next_cursor = page.next_cursor
      if (!next_cursor || next_cursor === cursor) {
        coverage_cursor.value = null
        _coverage_exhausted = true
        break
      }
      cursor = next_cursor
      coverage_cursor.value = cursor
    }
  } catch {
    if (isCurrentGeneration(generation)) coverage_error.value = 'Coverage could not be loaded right now.'
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
    const page = await fetchStoryArticles(article.value.story_id, {
      limit: RELATED_PAGE_SIZE,
      cursor: cursor ?? undefined
    }, {
      include_languages: true
    })
    if (!isCurrentGeneration(generation)) return

    related_articles.value = append
      ? appendUnique(related_articles.value, page.data)
      : appendUnique([], page.data)
    related_cursor.value = page.next_cursor && page.next_cursor !== cursor
      ? page.next_cursor
      : null
  } catch {
    if (isCurrentGeneration(generation)) related_error.value = 'Related articles could not be loaded right now.'
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
    const result = await fetchArticle(id)
    if (!isCurrentGeneration(generation)) return
    if (!result.id || !result.title) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
    article.value = result
    loading_article.value = false
    enrichArticle(generation)
  } catch (error) {
    if (isCurrentGeneration(generation)) {
      const failure = resourceError(error)
      if (failure.statusCode !== 503) showError(failure)
      article_error.value = failure.statusMessage
      loading_article.value = false
    }
  }
}

function enrichArticle(generation = _request_generation): void {
  const id = article.value?.id
  if (!id) return
  void fetchConfidence([id]).then((confidence_by_id) => {
    if (!isCurrentGeneration(generation) || !article.value) return
    article.value = { ...article.value, confidence: confidence_by_id[id] }
  }).catch(() => undefined)
  void loadCoverage(generation)
  void loadRelated(false, generation)
}

onMounted(() => {
  if (article.value) {
    trackEvent('coverage_open', { article_id: article.value.id })
    enrichArticle()
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
      :title="article_error"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          @click="loadArticle"
        />
      </template>
    </UAlert>

    <template v-else-if="article">
      <ArticleSnapshot :article="article" />
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
