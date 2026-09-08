<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StoryCard from '~/components/news/StoryCard.vue'
import StoryTimeline from '~/components/news/StoryTimeline.vue'
import type { NewsArticle, NewsStory } from '~/types/news'
import { hasTrendPayload, overlayArticleTrend } from '~/utils/trend'
import { logClientEvent } from '~/utils/telemetry'

const PAGE_SIZE = 5

const route = useRoute()
const { fetchArticle, fetchStory, fetchStoryArticles } = useBeansApi()
const story_id = computed(() => String(route.params.story_id || ''))
const story = ref<NewsStory | null>(null)
const coverage_articles = ref<NewsArticle[]>([])
const propagation_articles = ref<NewsArticle[]>([])
const articles_cursor = ref<string | null>(null)
const propagation_cursor = ref<string | null>(null)
const loading_story = ref(true)
const loading_coverage = ref(false)
const loading_propagation = ref(false)
const loading_more_articles = ref(false)
const story_error = ref<string | null>(null)
const coverage_error = ref<string | null>(null)
const propagation_error = ref<string | null>(null)
const can_load_more_articles = computed(() => Boolean(articles_cursor.value))
let _request_generation = 0

useSeoMeta({
  title: () => story.value ? `${story.value.title} | Beans` : 'Story | Beans',
  description: () => story.value?.summary || 'Story details and source coverage.'
})

function sortLatestFirst(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((left, right) => {
    const left_time = articleTime(left.published_at)
    const right_time = articleTime(right.published_at)
    return right_time - left_time
  })
}

function articleTime(value?: string | null): number {
  if (!value) return 0

  const date_value = new Date(value).getTime()
  return Number.isNaN(date_value) ? 0 : date_value
}

function articleIdentity(article: NewsArticle): string {
  return article.id || article.url || ''
}

function appendCoverageArticles(received: NewsArticle[]): void {
  const _known_ids = new Set(coverage_articles.value.map(articleIdentity))
  const _new_articles = received.filter((article) => {
    const _article_id = articleIdentity(article)
    if (!_article_id || _known_ids.has(_article_id)) return false
    _known_ids.add(_article_id)
    return true
  })

  coverage_articles.value = sortLatestFirst([...coverage_articles.value, ..._new_articles])
}

function appendPropagationArticles(received: NewsArticle[]): void {
  const _known_ids = new Set(propagation_articles.value.map(articleIdentity))
  const _new_articles = received.filter((article) => {
    const _article_id = articleIdentity(article)
    if (!_article_id || _known_ids.has(_article_id)) return false
    _known_ids.add(_article_id)
    return true
  })

  propagation_articles.value = [...propagation_articles.value, ..._new_articles]
}

function isCurrentGeneration(generation: number): boolean {
  return generation === _request_generation
}

async function enrichCoverageArticles(
  received: NewsArticle[],
  generation: number
): Promise<void> {
  const _enriched_articles = await Promise.all(
    received.map(async (article) => {
      if (!article.id || hasTrendPayload(article.trend)) return article

      const _detailed_article = await fetchArticle(article.id).catch(() => undefined)
      return overlayArticleTrend(article, _detailed_article?.trend)
    })
  )
  if (!isCurrentGeneration(generation)) return

  coverage_articles.value = coverage_articles.value.map((article) => {
    const _enriched_article = _enriched_articles.find(item =>
      articleIdentity(item) === articleIdentity(article)
    )

    return _enriched_article || article
  })
}

async function loadPropagation(
  seed: NewsArticle[],
  cursor: string | null,
  generation = _request_generation
): Promise<void> {
  if (!isCurrentGeneration(generation)) return

  const _story_id = story_id.value
  loading_propagation.value = true
  propagation_error.value = null
  propagation_cursor.value = cursor
  appendPropagationArticles(seed)

  try {
    let _cursor = cursor
    while (_cursor) {
      const _article_page = await fetchStoryArticles(_story_id, {
        limit: PAGE_SIZE,
        cursor: _cursor
      })
      if (!isCurrentGeneration(generation)) return

      appendPropagationArticles(_article_page.data)
      _cursor = _article_page.data.length && _article_page.next_cursor && _article_page.next_cursor !== _cursor
        ? _article_page.next_cursor
        : null
      propagation_cursor.value = _cursor
    }
  } catch {
    if (!isCurrentGeneration(generation)) return
    propagation_error.value = 'Story propagation could not be fully loaded.'
  } finally {
    if (isCurrentGeneration(generation)) {
      loading_propagation.value = false
    }
  }
}

async function loadCoverage(reset = false, generation = _request_generation): Promise<void> {
  if (!isCurrentGeneration(generation)) return
  if (!reset && (loading_coverage.value || !articles_cursor.value)) return

  const _story_id = story_id.value
  loading_coverage.value = true
  coverage_error.value = null

  const _cursor = reset ? null : articles_cursor.value

  try {
    const _article_page = await fetchStoryArticles(_story_id, {
      limit: PAGE_SIZE,
      cursor: _cursor
    })
    if (!isCurrentGeneration(generation)) return

    if (reset) {
      coverage_articles.value = []
      propagation_articles.value = []
      propagation_cursor.value = null
    }

    appendCoverageArticles(_article_page.data)
    void enrichCoverageArticles(_article_page.data, generation)
    articles_cursor.value = _article_page.data.length && _article_page.next_cursor !== _cursor
      ? _article_page.next_cursor
      : null

    if (reset) {
      void loadPropagation(_article_page.data, articles_cursor.value, generation)
    }
  } catch {
    if (!isCurrentGeneration(generation)) return
    coverage_error.value = 'Coverage articles could not be loaded right now.'
  } finally {
    if (isCurrentGeneration(generation)) {
      loading_coverage.value = false
    }
  }
}

async function loadStory(): Promise<void> {
  const _generation = ++_request_generation
  const _story_id = story_id.value
  loading_story.value = true
  loading_coverage.value = false
  loading_propagation.value = false
  loading_more_articles.value = false
  story_error.value = null
  coverage_error.value = null
  propagation_error.value = null
  story.value = null
  coverage_articles.value = []
  propagation_articles.value = []
  articles_cursor.value = null
  propagation_cursor.value = null

  try {
    const _story = await fetchStory(_story_id)
    if (!isCurrentGeneration(_generation)) return

    story.value = _story
    loading_story.value = false
    void loadCoverage(true, _generation)
  } catch {
    if (!isCurrentGeneration(_generation)) return
    story.value = null
    story_error.value = 'This story could not be loaded right now.'
    loading_story.value = false
  }
}

async function loadMoreArticles(): Promise<void> {
  if (!articles_cursor.value || loading_more_articles.value) return

  const _before_count = coverage_articles.value.length
  const _cursor_present = Boolean(articles_cursor.value)
  loading_more_articles.value = true
  try {
    await loadCoverage()
    logClientEvent({
      event: 'content_load',
      path: route.path,
      surface: 'story',
      feed: 'story_coverage',
      action: 'more',
      outcome: coverage_error.value ? 'error' : 'success',
      cursor_present: _cursor_present,
      requested_count: PAGE_SIZE,
      received_count: Math.max(0, coverage_articles.value.length - _before_count),
      visible_count: coverage_articles.value.length
    })
  } finally {
    loading_more_articles.value = false
  }
}

function retryPropagation(): Promise<void> {
  return loadPropagation(propagation_articles.value, propagation_cursor.value)
}

onMounted(() => {
  void loadStory()
})

watch(story_id, () => {
  void loadStory()
})
</script>

<template>
  <div class="space-y-7">
    <div>
      <UTooltip text="Back to news">
        <UButton
          to="/"
          icon="lucide:arrow-left"
          color="neutral"
          variant="ghost"
          square
          aria-label="Back to news"
        />
      </UTooltip>
    </div>

    <div
      v-if="loading_story"
      class="space-y-3"
    >
      <USkeleton class="h-7 w-3/4 bg-stone-800" />
      <USkeleton class="h-36 w-full rounded-lg bg-stone-800" />
      <USkeleton class="h-28 w-full rounded-lg bg-stone-800" />
    </div>

    <UAlert
      v-else-if="story_error"
      color="warning"
      variant="subtle"
      icon="lucide:triangle-alert"
      :title="story_error"
    >
      <template #actions>
        <UButton
          label="Retry"
          color="warning"
          variant="outline"
          size="xs"
          @click="loadStory"
        />
      </template>
    </UAlert>

    <template v-else-if="story">
      <StoryCard
        :story="story"
        mode="detailed"
        :linked="false"
      />
      <StoryTimeline
        :propagation_articles="propagation_articles"
        :coverage_articles="coverage_articles"
        :loading_propagation="loading_propagation"
        :loading_coverage="loading_coverage || loading_more_articles"
        :first_published_at="story.first_published_at"
        :last_published_at="story.last_published_at"
        :article_count="story.article_count"
        :coverage_error="coverage_error"
        :propagation_error="propagation_error"
        @retry-coverage="() => loadCoverage(!coverage_articles.length)"
        @retry-propagation="retryPropagation"
      />
      <div
        v-if="can_load_more_articles"
        class="flex justify-center pt-1"
      >
        <UButton
          label="More"
          icon="lucide:plus"
          color="neutral"
          variant="soft"
          :loading="loading_more_articles"
          @click="loadMoreArticles"
        />
      </div>
    </template>
  </div>
</template>
