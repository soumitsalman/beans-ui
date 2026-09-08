import { computed, ref } from 'vue'
import type { NewsSource, NewsStory } from '~/types/news'
import { normaliseTagInput } from '~/utils/formatters'
import { hasTrendPayload, overlayArticleTrend } from '~/utils/trend'
import { logClientEvent } from '~/utils/telemetry'

const PAGE_SIZE = 5
const RELEVANCE_SCORE_THRESHOLD = 0

interface SearchCriteria {
  query: string
  tags: string[]
  source_query: string
  source_ids: string[]
}

interface SearchInput {
  query?: string | null
  tags?: string | null
  source_query?: string | null
}

function primaryArticleIdentities(story: NewsStory): string[] {
  const _primary_article = story.top_articles?.[0]
  return [
    _primary_article?.id,
    _primary_article?.url,
    story.story_id ? undefined : story.id,
    story.story_id ? undefined : story.url
  ].filter((article_id): article_id is string => Boolean(article_id))
}

function appendStories(target: NewsStory[], received: NewsStory[]): NewsStory[] {
  const _known_story_ids = new Set<string>()
  const _known_article_ids = new Set<string>()

  for (const story of target) {
    if (story.story_id) _known_story_ids.add(story.story_id)
    for (const _article_id of primaryArticleIdentities(story)) _known_article_ids.add(_article_id)
  }

  const _new_stories: NewsStory[] = []

  for (const story of received) {
    const _article_ids = primaryArticleIdentities(story)
    if (story.story_id && _known_story_ids.has(story.story_id)) continue
    if (_article_ids.some(article_id => _known_article_ids.has(article_id))) continue
    if (!story.story_id && !_article_ids.length) continue

    if (story.story_id) _known_story_ids.add(story.story_id)
    for (const _article_id of _article_ids) _known_article_ids.add(_article_id)
    _new_stories.push(story)
  }

  return [...target, ..._new_stories]
}

function submittedCriteriaLabel(criteria: SearchCriteria | null): string {
  if (!criteria) return ''

  return [
    criteria.query,
    criteria.tags.length ? criteria.tags.join(', ') : '',
    criteria.source_query
  ].filter(Boolean).join(' · ')
}

function searchCriteria(input: SearchInput, source_ids: string[]): SearchCriteria {
  return {
    query: input.query?.trim() || '',
    tags: normaliseTagInput(input.tags),
    source_query: input.source_query?.trim() || '',
    source_ids
  }
}

function hasUnresolvedSources(criteria: SearchCriteria): boolean {
  return Boolean(criteria.source_query) && !criteria.source_ids.length
}

export function useSearchFeed() {
  const { fetchArticle, fetchSearchArticles, fetchSources } = useBeansApi()
  const route = useRoute()
  const results = ref<NewsStory[]>([])
  const source_matches = ref<NewsSource[]>([])
  const next_cursor = ref<string | null>(null)
  const loading_results = ref(false)
  const loading_sources = ref(false)
  const error_message = ref<string | null>(null)
  const has_searched = ref(false)
  const active_criteria = ref<SearchCriteria | null>(null)
  const last_input = ref<SearchInput | null>(null)
  const last_attempt_append = ref(false)
  const can_load_more = computed(() => Boolean(next_cursor.value))
  const loading = computed(() => loading_results.value || loading_sources.value)
  const empty_publisher_lookup = computed(() =>
    Boolean(active_criteria.value && hasUnresolvedSources(active_criteria.value))
  )
  const empty_message = computed(() => {
    const _label = submittedCriteriaLabel(active_criteria.value)
    if (empty_publisher_lookup.value) {
      return active_criteria.value?.source_query
        ? `No publishers matched ${active_criteria.value.source_query}.`
        : 'No publishers matched that source search.'
    }

    return _label
      ? `No news articles matched ${_label}.`
      : 'No news articles matched this search.'
  })
  let _search_generation = 0

  function nextSearchGeneration(): number {
    _search_generation += 1
    return _search_generation
  }

  function isCurrentSearchGeneration(search_generation: number): boolean {
    return search_generation === _search_generation
  }

  async function enrichSearchStories(
    received: NewsStory[],
    search_generation: number
  ): Promise<void> {
    const _enriched_stories = await Promise.all(
      received.map(async (story) => {
        const _primary_article = story.top_articles?.[0]
        if (!_primary_article?.id || hasTrendPayload(story.trend)) return story

        const _detailed_article = await fetchArticle(_primary_article.id).catch(() => undefined)
        return overlayArticleTrend(story, _detailed_article?.trend)
      })
    )
    if (!isCurrentSearchGeneration(search_generation)) return

    results.value = results.value.map((story) => {
      const _enriched_story = _enriched_stories.find(item => item.id === story.id)
      return _enriched_story || story
    })
  }

  async function findSources(source_query: string, search_generation: number): Promise<string[] | null> {
    if (!source_query) return []

    loading_sources.value = true
    try {
      const _page = await fetchSources({ q: source_query, limit: PAGE_SIZE })
      if (!isCurrentSearchGeneration(search_generation)) return []

      source_matches.value = _page.data
      return _page.data.map(source => source.id).filter((source_id): source_id is string => Boolean(source_id))
    } catch {
      if (isCurrentSearchGeneration(search_generation)) {
        const _label = submittedCriteriaLabel(searchCriteria(
          last_input.value || { source_query },
          []
        ))
        error_message.value = _label
          ? `Publisher search could not be loaded for ${_label}.`
          : 'Publisher search could not be loaded right now.'
      }
      return null
    } finally {
      if (isCurrentSearchGeneration(search_generation)) loading_sources.value = false
    }
  }

  async function loadResults(append = false, search_generation = _search_generation): Promise<void> {
    if (!isCurrentSearchGeneration(search_generation) || !active_criteria.value) return
    if (append && loading_results.value) return
    if (append && !next_cursor.value) return

    const _criteria = active_criteria.value
    if (hasUnresolvedSources(_criteria)) return

    const _cursor = append ? next_cursor.value : null
    const _before_count = results.value.length
    loading_results.value = true
    error_message.value = null
    last_attempt_append.value = append
    try {
      const _page = await fetchSearchArticles({
        q: _criteria.query || undefined,
        tags: _criteria.tags,
        sources: _criteria.source_ids,
        limit: PAGE_SIZE,
        cursor: _cursor,
        score_threshold: _criteria.query ? RELEVANCE_SCORE_THRESHOLD : undefined
      })
      if (!isCurrentSearchGeneration(search_generation)) return

      results.value = append
        ? appendStories(results.value, _page.data)
        : appendStories([], _page.data)
      next_cursor.value = _page.data.length && _page.next_cursor !== _cursor
        ? _page.next_cursor
        : null
      void enrichSearchStories(_page.data, search_generation)
      logClientEvent({
        event: 'content_load',
        path: route.path,
        surface: 'search',
        feed: 'search_results',
        action: append ? 'more' : 'initial',
        outcome: 'success',
        cursor_present: Boolean(_cursor),
        requested_count: PAGE_SIZE,
        received_count: _page.data.length,
        visible_count: results.value.length
      })
    } catch {
      if (isCurrentSearchGeneration(search_generation)) {
        const _label = submittedCriteriaLabel(_criteria)
        error_message.value = _label
          ? `Search results could not be loaded for ${_label}.`
          : 'Search results could not be loaded right now.'
        logClientEvent({
          event: 'content_load',
          path: route.path,
          surface: 'search',
          feed: 'search_results',
          action: append ? 'more' : 'initial',
          outcome: 'error',
          cursor_present: Boolean(_cursor),
          requested_count: PAGE_SIZE,
          received_count: 0,
          visible_count: _before_count
        })
      }
    } finally {
      if (isCurrentSearchGeneration(search_generation)) loading_results.value = false
    }
  }

  async function search(input: SearchInput): Promise<void> {
    const _source_query = input.source_query?.trim() || ''
    const _search_generation = nextSearchGeneration()
    has_searched.value = true
    loading_results.value = true
    loading_sources.value = false
    error_message.value = null
    source_matches.value = []
    next_cursor.value = null
    results.value = []
    active_criteria.value = null
    last_attempt_append.value = false
    last_input.value = { ...input }

    const _source_ids = await findSources(_source_query, _search_generation)
    if (!isCurrentSearchGeneration(_search_generation)) return
    if (_source_ids === null) {
      loading_results.value = false
      return
    }

    const _criteria = searchCriteria(input, _source_ids)
    if (!_criteria.query && !_criteria.tags.length && !_criteria.source_query) {
      error_message.value = 'Enter a topic, tag, or publisher to search.'
      loading_results.value = false
      return
    }

    active_criteria.value = _criteria
    if (hasUnresolvedSources(_criteria)) {
      loading_results.value = false
      return
    }

    await loadResults(false, _search_generation)
  }

  function retrySearch(): Promise<void> {
    if (active_criteria.value && hasUnresolvedSources(active_criteria.value)) {
      return last_input.value ? search(last_input.value) : Promise.resolve()
    }
    if (active_criteria.value) return loadResults(last_attempt_append.value, _search_generation)
    return last_input.value ? search(last_input.value) : Promise.resolve()
  }

  return {
    results,
    source_matches,
    loading,
    loading_results,
    loading_sources,
    error_message,
    empty_message,
    empty_publisher_lookup,
    has_searched,
    can_load_more,
    search,
    loadMore: () => loadResults(true),
    retrySearch
  }
}
