<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StoryCard from '~/components/news/StoryCard.vue'
import StoryTimeline from '~/components/news/StoryTimeline.vue'
import type { NewsArticle, NewsStory } from '~/types/news'
import { formatCount } from '~/utils/formatters'

const PAGE_SIZE = 5

const route = useRoute()
const { fetchStory, fetchStoryArticles } = useBeansApi()
const story_id = computed(() => String(route.params.story_id))
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

function appendCoverageArticles(received: NewsArticle[]): void {
  const _known_ids = new Set(coverage_articles.value.map(article => article.id))
  const _new_articles = received.filter((article) => {
    if (_known_ids.has(article.id)) return false
    _known_ids.add(article.id)
    return true
  })

  coverage_articles.value = sortLatestFirst([...coverage_articles.value, ..._new_articles])
}

function appendPropagationArticles(received: NewsArticle[]): void {
  const _known_ids = new Set(propagation_articles.value.map(article => article.id))
  const _new_articles = received.filter((article) => {
    if (_known_ids.has(article.id)) return false
    _known_ids.add(article.id)
    return true
  })

  propagation_articles.value = [...propagation_articles.value, ..._new_articles]
}

function enrichStoryPreview(): void {
  if (!story.value) return

  const _preview_article = coverage_articles.value.find(article => Boolean(article.title && article.summary))
  if (!_preview_article) return

  story.value = {
    ...story.value,
    title: _preview_article.title,
    summary: _preview_article.summary,
    image_url: story.value.image_url || _preview_article.image_url,
    source: story.value.source || _preview_article.source
  }
}

async function loadPropagation(seed: NewsArticle[], cursor: string | null): Promise<void> {
  loading_propagation.value = true
  propagation_error.value = null
  propagation_cursor.value = cursor
  appendPropagationArticles(seed)

  try {
    let _cursor = cursor
    while (_cursor) {
      const _article_page = await fetchStoryArticles(story_id.value, {
        limit: PAGE_SIZE,
        cursor: _cursor
      })

      appendPropagationArticles(_article_page.data)
      _cursor = _article_page.data.length && _article_page.next_cursor && _article_page.next_cursor !== _cursor
        ? _article_page.next_cursor
        : null
      propagation_cursor.value = _cursor
    }
  } catch {
    propagation_error.value = 'Story propagation could not be fully loaded.'
  } finally {
    loading_propagation.value = false
  }
}

async function loadCoverage(reset = false): Promise<void> {
  if (loading_coverage.value) return
  if (!reset && !articles_cursor.value) return

  loading_coverage.value = true
  coverage_error.value = null

  const _cursor = reset ? null : articles_cursor.value

  try {
    const _article_page = await fetchStoryArticles(story_id.value, {
      limit: PAGE_SIZE,
      cursor: _cursor
    })

    if (reset) {
      coverage_articles.value = []
      propagation_articles.value = []
      propagation_cursor.value = null
    }

    appendCoverageArticles(_article_page.data)
    enrichStoryPreview()
    articles_cursor.value = _article_page.data.length && _article_page.next_cursor !== _cursor
      ? _article_page.next_cursor
      : null

    if (reset) {
      await loadPropagation(_article_page.data, articles_cursor.value)
    }
  } catch {
    coverage_error.value = 'Coverage articles could not be loaded right now.'
  } finally {
    loading_coverage.value = false
  }
}

async function loadStory(): Promise<void> {
  loading_story.value = true
  story_error.value = null
  coverage_error.value = null
  propagation_error.value = null
  story.value = null
  coverage_articles.value = []
  propagation_articles.value = []
  articles_cursor.value = null
  propagation_cursor.value = null

  try {
    story.value = await fetchStory(story_id.value)
    await loadCoverage(true)
  } catch {
    story.value = null
    story_error.value = 'This story could not be loaded right now.'
  } finally {
    loading_story.value = false
  }
}

async function loadMoreArticles(): Promise<void> {
  if (!articles_cursor.value || loading_more_articles.value) return

  loading_more_articles.value = true
  try {
    await loadCoverage()
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
    <div class="flex items-center justify-between gap-4">
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
      <div
        v-if="story && (story.source_count || story.article_count)"
        class="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs tabular-nums text-stone-500"
      >
        <span v-if="story.source_count">
          {{ formatCount(story.source_count) }} {{ story.source_count === 1 ? 'source' : 'sources' }}
        </span>
        <span v-if="story.article_count">
          {{ formatCount(story.article_count) }} {{ story.article_count === 1 ? 'article' : 'articles' }}
        </span>
      </div>
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
      />
      <StoryTimeline
        :propagation_articles="propagation_articles"
        :coverage_articles="coverage_articles"
        :loading_propagation="loading_propagation"
        :loading_coverage="loading_coverage || loading_more_articles"
        :first_published_at="story.first_published_at"
        :last_published_at="story.last_published_at"
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
          label="Load more articles"
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
