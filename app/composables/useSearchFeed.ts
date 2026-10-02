import { computed, ref } from 'vue'
import type { NewsArticle } from '~/types/news'
import { useArticleEnrichment } from '~/composables/useArticleEnrichment'
import { normaliseSourceInput } from '~/utils/searchQuery'
import { normaliseTagInput } from '~/utils/formatters'
import { logClientEvent } from '~/utils/telemetry'

const PAGE_SIZE = 5
const RELEVANCE_SCORE_THRESHOLD = 0

interface SearchCriteria {
  query: string
  tags: string[]
  sources: string[]
}

interface SearchInput {
  query?: string | null
  tags?: string | string[] | null
  sources?: string | string[] | null
}

function appendArticles(target: NewsArticle[], received: NewsArticle[]): NewsArticle[] {
  const known_ids = new Set(target.map(article => article.id || article.url).filter(Boolean))
  const fresh = received.filter((article) => {
    const id = article.id || article.url
    if (!id || known_ids.has(id)) return false
    known_ids.add(id)
    return true
  })
  return [...target, ...fresh]
}

function submittedCriteriaLabel(criteria: SearchCriteria | null): string {
  if (!criteria) return ''
  return [criteria.query, criteria.tags.length ? criteria.tags.join(', ') : '', criteria.sources.join(', ')].filter(Boolean).join(' · ')
}

function searchCriteria(input: SearchInput): SearchCriteria {
  return {
    query: input.query?.trim() || '',
    tags: normaliseTagInput(input.tags),
    sources: normaliseSourceInput(input.sources)
  }
}

export function useSearchFeed() {
  const { fetchSearchArticles } = useBeansApi()
  const { enrichArticles } = useArticleEnrichment()
  const route = useRoute()
  const articles = ref<NewsArticle[]>([])
  const next_cursor = ref<string | null>(null)
  const loading = ref(false)
  const error_message = ref<string | null>(null)
  const has_searched = ref(false)
  const active_criteria = ref<SearchCriteria | null>(null)
  const last_input = ref<SearchInput | null>(null)
  const last_attempt_append = ref(false)
  const can_load_more = computed(() => Boolean(next_cursor.value))
  const empty_message = computed(() => {
    const label = submittedCriteriaLabel(active_criteria.value)
    return label ? `No news articles matched ${label}.` : 'No news articles matched this search.'
  })
  let _generation = 0

  function isCurrentGeneration(generation: number): boolean {
    return generation === _generation
  }

  async function loadResults(append = false, generation = _generation): Promise<void> {
    if (!isCurrentGeneration(generation) || !active_criteria.value) return
    if (append && (loading.value || !next_cursor.value)) return

    const criteria = active_criteria.value
    const cursor = append ? next_cursor.value : null
    const before_count = articles.value.length
    loading.value = true
    error_message.value = null
    last_attempt_append.value = append

    try {
      const page = await fetchSearchArticles({
        q: criteria.query || undefined,
        tags: criteria.tags,
        domains: criteria.sources,
        limit: PAGE_SIZE,
        cursor,
        score_threshold: criteria.query ? RELEVANCE_SCORE_THRESHOLD : undefined
      })
      if (!isCurrentGeneration(generation)) return

      articles.value = append ? appendArticles(articles.value, page.data) : appendArticles([], page.data)
      next_cursor.value = page.data.length && page.next_cursor !== cursor ? page.next_cursor : null
      if (page.data.length) {
        void enrichArticles(page.data).then((enriched) => {
          if (!isCurrentGeneration(generation)) return
          const by_id = new Map(enriched.map(article => [article.id, article]))
          articles.value = articles.value.map(article => by_id.get(article.id) ?? article)
        })
      }

      logClientEvent({
        event: 'content_load',
        path: route.path,
        surface: 'search',
        feed: 'search_results',
        action: append ? 'more' : 'initial',
        outcome: 'success',
        cursor_present: Boolean(cursor),
        requested_count: PAGE_SIZE,
        received_count: page.data.length,
        visible_count: articles.value.length
      })
    } catch {
      if (isCurrentGeneration(generation)) {
        const label = submittedCriteriaLabel(criteria)
        error_message.value = label
          ? `Search results could not be loaded for ${label}.`
          : 'Search results could not be loaded right now.'
        logClientEvent({
          event: 'content_load',
          path: route.path,
          surface: 'search',
          feed: 'search_results',
          action: append ? 'more' : 'initial',
          outcome: 'error',
          cursor_present: Boolean(cursor),
          requested_count: PAGE_SIZE,
          received_count: 0,
          visible_count: before_count
        })
      }
    } finally {
      if (isCurrentGeneration(generation)) loading.value = false
    }
  }

  async function search(input: SearchInput): Promise<void> {
    const generation = ++_generation
    has_searched.value = true
    loading.value = true
    error_message.value = null
    next_cursor.value = null
    articles.value = []
    active_criteria.value = null
    last_attempt_append.value = false
    last_input.value = {
      query: input.query,
      sources: Array.isArray(input.sources) ? [...input.sources] : input.sources,
      tags: Array.isArray(input.tags) ? [...input.tags] : input.tags
    }

    const criteria = searchCriteria(input)
    if (!criteria.query && !criteria.tags.length && !criteria.sources.length) {
      error_message.value = 'Enter a topic, tag, or source domain to search.'
      loading.value = false
      return
    }

    active_criteria.value = criteria
    await loadResults(false, generation)
  }

  function retrySearch(): Promise<void> {
    if (active_criteria.value) return loadResults(last_attempt_append.value, _generation)
    return last_input.value ? search(last_input.value) : Promise.resolve()
  }

  return {
    articles,
    loading,
    error_message,
    empty_message,
    has_searched,
    can_load_more,
    search,
    loadMore: () => loadResults(true),
    retrySearch
  }
}
