import { computed, ref, unref, watch } from 'vue'
import type { MaybeRef } from 'vue'
import type { NewsCategory } from '~/settings/categories'
import type { BeansPageParams, NewsArticle } from '~/types/news'
import { useArticleEnrichment } from '~/composables/useArticleEnrichment'
import { logClientEvent } from '~/utils/telemetry'

const PAGE_SIZE = 5
const TRENDING_PER_BATCH = 1
const LATEST_PER_BATCH = 4
const TRENDING_WINDOW_DAYS = 2
const LATEST_WINDOW_DAYS = 7

interface FeedFilters {
  categories?: string[]
  sources?: string[]
}

type FeedKind = 'trending' | 'latest'

interface FeedStream {
  cursor: string | null
  exhausted: boolean
  ids: Set<string>
  from: string
}

export function useNewsFeed(
  category?: MaybeRef<NewsCategory | undefined>,
  source_id?: MaybeRef<string | undefined>
) {
  const { fetchLatestArticles, fetchSourceArticles, fetchTopHeadlines } = useBeansApi()
  const { enrichArticles } = useArticleEnrichment()
  const route = useRoute()
  const articles = ref<NewsArticle[]>([])
  const loading = ref(false)
  const error_message = ref<string | null>(null)
  const active_category = computed(() => unref(category))
  const active_source_id = computed(() => unref(source_id))
  const trending_stream: FeedStream = {
    cursor: null,
    exhausted: false,
    ids: new Set(),
    from: ''
  }
  const latest_stream: FeedStream = {
    cursor: null,
    exhausted: false,
    ids: new Set(),
    from: ''
  }
  const source_cursor = ref<string | null>(null)
  const source_exhausted = ref(false)
  const can_load_more = computed(() => active_source_id.value
    ? !source_exhausted.value
    : !trending_stream.exhausted || !latest_stream.exhausted)
  let _generation = 0

  function filters(): FeedFilters {
    return {
      categories: active_category.value?.category_values
        ? [...active_category.value.category_values]
        : undefined,
      sources: active_source_id.value ? [active_source_id.value] : undefined
    }
  }

  function resetPaging(): void {
    trending_stream.cursor = null
    trending_stream.exhausted = false
    trending_stream.ids.clear()
    trending_stream.from = new Date(Date.now() - TRENDING_WINDOW_DAYS * 86400000).toISOString().slice(0, 10)
    latest_stream.cursor = null
    latest_stream.exhausted = false
    latest_stream.ids.clear()
    latest_stream.from = new Date(Date.now() - LATEST_WINDOW_DAYS * 86400000).toISOString().slice(0, 10)
    source_cursor.value = null
    source_exhausted.value = false
  }

  function seenArticleIds(batch: NewsArticle[]): Set<string> {
    return new Set([...articles.value, ...batch].map(article => article.id).filter(Boolean))
  }

  function stream(kind: FeedKind): FeedStream {
    return kind === 'trending' ? trending_stream : latest_stream
  }

  async function fetchMixedStream(
    kind: FeedKind,
    desired_count: number,
    batch: NewsArticle[],
    generation: number
  ): Promise<NewsArticle[]> {
    const state = stream(kind)
    const opposite_state = stream(kind === 'trending' ? 'latest' : 'trending')
    const received: NewsArticle[] = []
    const fetch_page = kind === 'trending' ? fetchTopHeadlines : fetchLatestArticles

    while (received.length < desired_count && !state.exhausted && generation === _generation) {
      const previous_cursor = state.cursor
      const params: BeansPageParams = {
        ...filters(),
        limit: desired_count - received.length,
        cursor: previous_cursor ?? undefined,
        exclude_ids: [...opposite_state.ids],
        from: state.from
      }
      const page = await fetch_page(params)
      if (generation !== _generation) return received

      const known_ids = seenArticleIds(batch)
      for (const article of page.data) {
        if (!article.id || known_ids.has(article.id)) continue
        known_ids.add(article.id)
        state.ids.add(article.id)
        received.push(article)
        batch.push(article)
        if (received.length >= desired_count) break
      }

      state.cursor = page.next_cursor && page.next_cursor !== previous_cursor
        ? page.next_cursor
        : null
      state.exhausted = !state.cursor
    }

    return received
  }

  async function fetchSourceBatch(generation: number): Promise<NewsArticle[]> {
    const id = active_source_id.value
    if (!id || source_exhausted.value) return []

    const previous_cursor = source_cursor.value
    const page = await fetchSourceArticles(id, {
      limit: PAGE_SIZE,
      cursor: previous_cursor ?? undefined
    })
    if (generation !== _generation) return []

    const known_ids = seenArticleIds([])
    const received = page.data.filter((article) => {
      if (!article.id || article.source?.id !== id || known_ids.has(article.id)) return false
      known_ids.add(article.id)
      return true
    })
    source_cursor.value = page.next_cursor && page.next_cursor !== previous_cursor
      ? page.next_cursor
      : null
    source_exhausted.value = !source_cursor.value
    return received
  }

  async function loadBatch(append: boolean): Promise<void> {
    if (append && loading.value) return
    if (append && !can_load_more.value) return

    const generation = append ? _generation : ++_generation
    if (!append) {
      articles.value = []
      error_message.value = null
      resetPaging()
    }

    loading.value = true
    error_message.value = null
    const batch: NewsArticle[] = []

    try {
      if (active_source_id.value) {
        batch.push(...await fetchSourceBatch(generation))
      } else {
        let trending_error = false
        let latest_error = false
        try {
          await fetchMixedStream('trending', TRENDING_PER_BATCH, batch, generation)
        } catch {
          trending_error = true
        }
        try {
          await fetchMixedStream('latest', LATEST_PER_BATCH, batch, generation)
        } catch {
          latest_error = true
        }

        const unfilled_count = Math.max(0, PAGE_SIZE - batch.length)
        if (unfilled_count && !latest_error && latest_stream.exhausted && !trending_stream.exhausted) {
          try {
            await fetchMixedStream('trending', unfilled_count, batch, generation)
          } catch {
            trending_error = true
          }
        } else if (unfilled_count && !trending_error && trending_stream.exhausted && !latest_stream.exhausted) {
          try {
            await fetchMixedStream('latest', unfilled_count, batch, generation)
          } catch {
            latest_error = true
          }
        }

        if (trending_error || latest_error) {
          error_message.value = 'Some news could not be loaded right now.'
        }
      }

      if (generation !== _generation) return
      articles.value = append ? [...articles.value, ...batch] : batch
      if (batch.length) {
        void enrichArticles(batch).then((enriched) => {
          if (generation !== _generation) return
          const by_id = new Map(enriched.map(article => [article.id, article]))
          articles.value = articles.value.map(article => by_id.get(article.id) ?? article)
        })
      }

      logClientEvent({
        event: 'content_load',
        path: route.path,
        surface: active_source_id.value ? 'source' : active_category.value ? 'category' : 'home',
        feed: active_source_id.value ? 'source_latest' : 'article_feed',
        action: append ? 'more' : 'initial',
        outcome: error_message.value ? 'error' : 'success',
        requested_count: PAGE_SIZE,
        received_count: batch.length,
        visible_count: articles.value.length,
        cursor_present: Boolean(source_cursor.value || trending_stream.cursor || latest_stream.cursor)
      })
    } catch {
      if (generation === _generation) {
        error_message.value = 'News could not be loaded right now.'
      }
    } finally {
      if (generation === _generation) loading.value = false
    }
  }

  async function refreshFeed(): Promise<void> {
    await loadBatch(false)
  }

  async function loadMore(): Promise<void> {
    await loadBatch(true)
  }

  async function retryFeed(): Promise<void> {
    if (articles.value.length) await loadMore()
    else await refreshFeed()
  }

  watch(active_category, () => {
    void refreshFeed()
  })

  return {
    articles,
    loading,
    error_message,
    can_load_more,
    refreshFeed,
    loadMore,
    retryFeed
  }
}
