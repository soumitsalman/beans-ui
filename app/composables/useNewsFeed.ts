import { computed, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { NewsCategory } from '~/settings/categories'
import type { EspressoConfidence, NewsArticle, NewsStory, NewsTrend } from '~/types/news'
import { sourceIdentity } from '~/utils/source'
import { logClientEvent } from '~/utils/telemetry'

const DISPLAY_PAGE_SIZE = 5
const FETCH_BATCH_SIZE = 20
const MAX_FETCH_BATCH_SIZE = 100

interface FeedFilters {
  categories?: string[]
}

export function useNewsFeed(category?: MaybeRef<NewsCategory | undefined>) {
  const { fetchArticle, fetchLatestArticles, fetchSimilarArticles, fetchStory, fetchTopHeadlines } = useBeansApi()
  const { fetchConfidence } = useEspressoApi()
  const route = useRoute()
  const top_headlines = ref<NewsStory[]>([])
  const latest_news = ref<NewsStory[]>([])
  const top_headlines_pool = ref<NewsStory[]>([])
  const latest_news_pool = ref<NewsStory[]>([])
  const latest_news_cursor = ref<string | null>(null)
  const top_headlines_exhausted = ref(false)
  const latest_news_exhausted = ref(false)
  const loading_top_headlines = ref(false)
  const loading_latest_news = ref(false)
  const top_headlines_error = ref<string | null>(null)
  const latest_news_error = ref<string | null>(null)
  const active_category = computed(() => unref(category))
  const can_load_more_top_headlines = computed(() =>
    top_headlines.value.length < top_headlines_pool.value.length || !top_headlines_exhausted.value
  )
  const can_load_more_latest_news = computed(() =>
    latest_news.value.length < latest_news_pool.value.length || !latest_news_exhausted.value
  )
  let _top_feed_generation = 0
  let _latest_feed_generation = 0
  let _top_fetch_limit = FETCH_BATCH_SIZE

  function logFeedLoad(
    feed: 'top_headlines' | 'latest_news',
    append: boolean,
    outcome: 'success' | 'error',
    requested_count: number,
    received_count: number,
    visible_count: number,
    cursor_present: boolean
  ): void {
    logClientEvent({
      event: 'content_load',
      path: route.path,
      surface: active_category.value ? 'category' : 'home',
      feed,
      action: append ? 'more' : 'initial',
      outcome,
      requested_count,
      received_count,
      visible_count,
      cursor_present
    })
  }

  function filters(): FeedFilters {
    return {
      categories: active_category.value?.category_values
        ? [...active_category.value.category_values]
        : undefined
    }
  }

  function appendStories(target: NewsStory[], received: NewsStory[]): NewsStory[] {
    const _known_story_ids = new Set<string>()
    const _known_article_ids = new Set<string>()

    for (const story of target) {
      if (story.story_id) _known_story_ids.add(story.story_id)
      for (const _article_id of feedArticleIdentities(story)) _known_article_ids.add(_article_id)
    }

    const _new_stories: NewsStory[] = []

    for (const story of received) {
      const _article_ids = feedArticleIdentities(story)
      if (story.story_id && _known_story_ids.has(story.story_id)) continue
      if (_article_ids.some(article_id => _known_article_ids.has(article_id))) continue
      if (!story.story_id && !_article_ids.length) continue

      if (story.story_id) _known_story_ids.add(story.story_id)
      for (const _article_id of _article_ids) _known_article_ids.add(_article_id)
      _new_stories.push(story)
    }

    return [...target, ..._new_stories]
  }

  function nextCursor(value: string | null, previous: string | null, received_count: number): string | null {
    if (!received_count || !value || value === previous) return null
    return value
  }

  function hasTrend(trend?: NewsTrend | null): boolean {
    if (!trend) return false

    return [
      trend.trend_score,
      trend.likes,
      trend.comments,
      trend.mentions,
      trend.shares,
      trend.audiences,
      trend.related
    ].some(value => value != null)
  }

  function articleIdentity(article: NewsArticle): string {
    return article.id || article.url || ''
  }

  function feedArticleIdentities(story: NewsStory): string[] {
    const _primary_article = story.top_articles?.[0]
    return [
      _primary_article?.id,
      _primary_article?.url,
      story.story_id ? undefined : story.id,
      story.story_id ? undefined : story.url
    ].filter((article_id): article_id is string => Boolean(article_id))
  }

  function distinctSourceCount(articles: NewsArticle[]): number {
    const _source_ids = new Set<string>()

    for (const article of articles) {
      const _source_id = sourceIdentity(article)
      if (_source_id) _source_ids.add(_source_id)
    }

    return _source_ids.size
  }

  function relatedArticles(story: NewsStory, similar_articles: NewsArticle[]): NewsArticle[] {
    const _articles = [...(story.top_articles ?? []), ...similar_articles]
    const _seen_ids = new Set<string>()

    return _articles.filter((article) => {
      const _article_id = articleIdentity(article)
      if (!_article_id || _seen_ids.has(_article_id)) return false

      _seen_ids.add(_article_id)
      return true
    })
  }

  function mergeEnrichedStory(
    feed_story: NewsStory,
    enriched_story: NewsStory | undefined,
    similar_articles: NewsArticle[],
    detailed_article: NewsArticle | undefined,
    confidence: EspressoConfidence | undefined
  ): NewsStory {
    const _source_articles = relatedArticles(feed_story, similar_articles)
    const _trend = hasTrend(feed_story.trend)
      ? feed_story.trend
      : hasTrend(detailed_article?.trend)
        ? detailed_article?.trend
        : hasTrend(enriched_story?.trend)
          ? enriched_story?.trend
          : feed_story.trend

    return {
      ...feed_story,
      first_published_at: feed_story.first_published_at ?? enriched_story?.first_published_at,
      last_published_at: feed_story.last_published_at ?? enriched_story?.last_published_at,
      trend: _trend,
      top_articles: _source_articles,
      source_count: enriched_story?.source_count || distinctSourceCount(_source_articles) || feed_story.source_count,
      confidence: confidence ?? feed_story.confidence,
      article_count: enriched_story?.article_count || feed_story.article_count
    }
  }

  function nextFeedGeneration(target: 'top' | 'latest', append: boolean): number {
    if (append) {
      return target === 'top' ? _top_feed_generation : _latest_feed_generation
    }

    if (target === 'top') {
      _top_feed_generation += 1
      return _top_feed_generation
    }

    _latest_feed_generation += 1
    return _latest_feed_generation
  }

  function isCurrentGeneration(target: 'top' | 'latest', feed_generation: number): boolean {
    return target === 'top'
      ? feed_generation === _top_feed_generation
      : feed_generation === _latest_feed_generation
  }

  async function enrichStories(
    received: NewsStory[],
    target: 'top' | 'latest',
    feed_generation: number
  ): Promise<void> {
    const _enriched_stories = await Promise.all(
      received.map(async (story) => {
        const _primary_article = story.top_articles?.[0]
        const [_story, _similar_articles, _detailed_article, _confidence] = await Promise.all([
          story.story_id
            ? fetchStory(story.story_id).catch(() => undefined)
            : Promise.resolve(undefined),
          _primary_article?.id
            ? fetchSimilarArticles(_primary_article.id, { limit: DISPLAY_PAGE_SIZE })
                .then(page => page.data)
                .catch(() => [])
            : Promise.resolve([]),
          _primary_article?.id && !hasTrend(story.trend)
            ? fetchArticle(_primary_article.id).catch(() => undefined)
            : Promise.resolve(undefined),
          _primary_article?.id
            ? fetchConfidence(_primary_article.id).catch(() => undefined)
            : Promise.resolve(undefined)
        ])

        return mergeEnrichedStory(story, _story, _similar_articles, _detailed_article, _confidence)
      })
    )
    if (!isCurrentGeneration(target, feed_generation)) return

    const _by_id = new Map(_enriched_stories.map(story => [story.id, story]))
    const _overlay = (story: NewsStory) => _by_id.get(story.id) || story
    const _visible = target === 'top' ? top_headlines : latest_news
    const _pool = target === 'top' ? top_headlines_pool : latest_news_pool

    _pool.value = _pool.value.map(_overlay)
    _visible.value = _visible.value.map(_overlay)
  }

  function revealStories(pool: NewsStory[], target: number): NewsStory[] {
    return pool.slice(0, Math.min(target, pool.length))
  }

  function resetTopPaging(): void {
    top_headlines_pool.value = []
    top_headlines_exhausted.value = false
    _top_fetch_limit = FETCH_BATCH_SIZE
  }

  function resetLatestPaging(): void {
    latest_news_pool.value = []
    latest_news_cursor.value = null
    latest_news_exhausted.value = false
  }

  async function fillTopHeadlinesPool(
    min_unique: number,
    feed_generation: number
  ): Promise<NewsStory[]> {
    let _received_for_enrich: NewsStory[] = []

    while (
      top_headlines_pool.value.length < min_unique
      && !top_headlines_exhausted.value
      && isCurrentGeneration('top', feed_generation)
    ) {
      const _page = await fetchTopHeadlines({
        ...filters(),
        limit: _top_fetch_limit
      })
      if (!isCurrentGeneration('top', feed_generation)) return _received_for_enrich

      const _before = top_headlines_pool.value.length
      top_headlines_pool.value = appendStories(top_headlines_pool.value, _page.data)
      const _added = top_headlines_pool.value.length - _before
      _received_for_enrich = [..._received_for_enrich, ..._page.data]
      const _short_page = _page.data.length < _top_fetch_limit

      if (_short_page) {
        top_headlines_exhausted.value = true
        break
      }

      if (_added === 0) {
        if (_top_fetch_limit >= MAX_FETCH_BATCH_SIZE) {
          top_headlines_exhausted.value = true
          break
        }
        _top_fetch_limit = Math.min(MAX_FETCH_BATCH_SIZE, _top_fetch_limit + FETCH_BATCH_SIZE)
        continue
      }

      if (top_headlines_pool.value.length < min_unique && _top_fetch_limit < MAX_FETCH_BATCH_SIZE) {
        _top_fetch_limit = Math.min(MAX_FETCH_BATCH_SIZE, _top_fetch_limit + FETCH_BATCH_SIZE)
      }
    }

    return _received_for_enrich
  }

  async function fillLatestNewsPool(
    min_unique: number,
    feed_generation: number
  ): Promise<NewsStory[]> {
    let _received_for_enrich: NewsStory[] = []

    while (
      latest_news_pool.value.length < min_unique
      && !latest_news_exhausted.value
      && isCurrentGeneration('latest', feed_generation)
    ) {
      if (!latest_news_cursor.value && latest_news_pool.value.length) {
        latest_news_exhausted.value = true
        break
      }

      const _cursor = latest_news_cursor.value
      const _page = await fetchLatestArticles({
        ...filters(),
        limit: FETCH_BATCH_SIZE,
        cursor: _cursor
      })
      if (!isCurrentGeneration('latest', feed_generation)) return _received_for_enrich

      const _before = latest_news_pool.value.length
      latest_news_pool.value = appendStories(latest_news_pool.value, _page.data)
      const _added = latest_news_pool.value.length - _before
      _received_for_enrich = [..._received_for_enrich, ..._page.data]
      latest_news_cursor.value = nextCursor(_page.next_cursor, _cursor, _page.data.length)
      if (!latest_news_cursor.value) latest_news_exhausted.value = true

      if (!_page.data.length && _added === 0) {
        latest_news_exhausted.value = true
        break
      }
    }

    return _received_for_enrich
  }

  async function loadTopHeadlines(append = false): Promise<void> {
    if (append && loading_top_headlines.value) return
    if (append && top_headlines.value.length >= top_headlines_pool.value.length && top_headlines_exhausted.value) return

    const _feed_generation = nextFeedGeneration('top', append)
    if (!append) resetTopPaging()
    const _target = append
      ? top_headlines.value.length + DISPLAY_PAGE_SIZE
      : DISPLAY_PAGE_SIZE
    const _before_count = top_headlines.value.length
    loading_top_headlines.value = true
    top_headlines_error.value = null
    try {
      const _received = await fillTopHeadlinesPool(_target, _feed_generation)
      if (!isCurrentGeneration('top', _feed_generation)) return

      top_headlines.value = revealStories(top_headlines_pool.value, _target)
      void enrichStories(_received, 'top', _feed_generation)
      logFeedLoad(
        'top_headlines',
        append,
        'success',
        _target,
        _received.length,
        top_headlines.value.length,
        false
      )
    } catch {
      if (isCurrentGeneration('top', _feed_generation)) {
        top_headlines_error.value = 'Top headlines could not be loaded right now.'
        logFeedLoad(
          'top_headlines',
          append,
          'error',
          _target,
          0,
          _before_count,
          false
        )
      }
    } finally {
      if (isCurrentGeneration('top', _feed_generation)) loading_top_headlines.value = false
    }
  }

  async function loadLatestNews(append = false): Promise<void> {
    if (append && loading_latest_news.value) return
    if (append && latest_news.value.length >= latest_news_pool.value.length && latest_news_exhausted.value) return

    const _feed_generation = nextFeedGeneration('latest', append)
    if (!append) resetLatestPaging()
    const _target = append
      ? latest_news.value.length + DISPLAY_PAGE_SIZE
      : DISPLAY_PAGE_SIZE
    const _before_count = latest_news.value.length
    const _cursor_present = Boolean(latest_news_cursor.value)
    loading_latest_news.value = true
    latest_news_error.value = null
    try {
      const _received = await fillLatestNewsPool(_target, _feed_generation)
      if (!isCurrentGeneration('latest', _feed_generation)) return

      latest_news.value = revealStories(latest_news_pool.value, _target)
      void enrichStories(_received, 'latest', _feed_generation)
      logFeedLoad(
        'latest_news',
        append,
        'success',
        _target,
        _received.length,
        latest_news.value.length,
        _cursor_present
      )
    } catch {
      if (isCurrentGeneration('latest', _feed_generation)) {
        latest_news_error.value = 'Latest news could not be loaded right now.'
        logFeedLoad(
          'latest_news',
          append,
          'error',
          _target,
          0,
          _before_count,
          _cursor_present
        )
      }
    } finally {
      if (isCurrentGeneration('latest', _feed_generation)) loading_latest_news.value = false
    }
  }

  async function refreshFeed(clear_content = false): Promise<void> {
    nextFeedGeneration('top', false)
    nextFeedGeneration('latest', false)
    top_headlines_error.value = null
    latest_news_error.value = null
    resetTopPaging()
    resetLatestPaging()
    if (clear_content) {
      top_headlines.value = []
      latest_news.value = []
    }
    await Promise.all([loadTopHeadlines(), loadLatestNews()])
  }

  function retryTopHeadlines(): Promise<void> {
    return loadTopHeadlines(Boolean(top_headlines.value.length))
  }

  function retryLatestNews(): Promise<void> {
    return loadLatestNews(Boolean(latest_news.value.length))
  }

  return {
    top_headlines,
    latest_news,
    loading_top_headlines,
    loading_latest_news,
    can_load_more_top_headlines,
    can_load_more_latest_news,
    top_headlines_error,
    latest_news_error,
    refreshFeed,
    loadMoreTopHeadlines: () => loadTopHeadlines(true),
    loadMoreLatestNews: () => loadLatestNews(true),
    retryTopHeadlines,
    retryLatestNews
  }
}
