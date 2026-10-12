import type { H3Event } from 'h3'
import { createError, setHeader } from 'h3'
import type { NewsArticle, NewsPage } from '../../app/types/news'
import type { FeedSnapshot, FeedStreamSnapshot } from '../../app/types/discovery'
import type { ArticleAction, FeedInput, SourceAction } from '#shared/actions'
import { ACTION_INPUTS } from './actionInput'
import type { ActionName } from './actionInput'
import { createBeansClient, createEspressoClient } from './beansClient'
import { fetchPresentationApi } from './proxyApi'
import { withActionDeadline } from './actionDeadline'

const MAX_FEED_PAGES = 10
const MAX_COVERAGE_PAGES = 100

export function createPresentationActions(event: H3Event) {
  const config = useRuntimeConfig(event)
  return async (action: string, payload: unknown) => {
    try {
      return await withActionDeadline(signal => executePresentationAction(action, payload, signal))
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 503) setHeader(event, 'retry-after', 5)
      throw error
    }
  }

  async function executePresentationAction(action: string, payload: unknown, signal: AbortSignal): Promise<unknown> {
    const fetch_api = <T>(api: 'beans' | 'espresso', path: string, query = {}) => fetchPresentationApi<T>(
      api === 'beans' ? config.beans_api_base_url : config.espresso_api_base_url,
      path, query, config.cafecito_api_key, signal
    )
    const beans = createBeansClient(fetch_api, config.public.default_score_threshold)
    const espresso = createEspressoClient(fetch_api)

    async function enrichArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
      const confidence = await espresso.fetchConfidence(articles.map(article => article.id)).catch(() => ({}))
      return Promise.all(articles.map(async (article) => {
        const page = article.story_id
          ? await beans.fetchStoryArticles(article.story_id, { limit: 50 }).catch(() => null)
          : null
        const seen_sources = new Set([article.source?.id])
        const publishers = (page?.data ?? []).filter((item) => {
          const id = item.source?.id
          if (!id || seen_sources.has(id)) return false
          seen_sources.add(id)
          return true
        }).slice(0, 5).map(item => ({ id: item.id, source: item.source, url: item.url }))
        return { ...article, confidence: (confidence as Record<string, NewsArticle['confidence']>)[article.id], other_publishers: publishers }
      }))
    }

    function initialStream(days: number): FeedStreamSnapshot {
      return { cursor: null, exhausted: false, ids: [], from: new Date(Date.now() - days * 86400000).toISOString().slice(0, 10) }
    }

    async function feed(input: FeedInput): Promise<FeedSnapshot> {
      const trending = input.trending ?? initialStream(2)
      const latest = input.latest ?? initialStream(7)
      const batch: NewsArticle[] = []
      const seen_ids = new Set(input.seen_ids ?? [...trending.ids, ...latest.ids])
      let error_message: string | null = null
      let source_cursor = input.source_cursor ?? null
      const failures = new Set<string>()
      async function fetchStream(kind: 'trending' | 'latest', desired: number): Promise<void> {
        const state = kind === 'trending' ? trending : latest
        const opposite = kind === 'trending' ? latest : trending
        const fetch_page = kind === 'trending' ? beans.fetchTopHeadlines : beans.fetchLatestArticles
        let received = 0
        const cursors = new Set<string | null>()
        try {
          for (let index = 0; index < MAX_FEED_PAGES && !state.exhausted && received < desired; index++) {
            const previous_cursor = state.cursor
            if (cursors.has(previous_cursor)) break
            cursors.add(previous_cursor)
            const page = await fetch_page({ categories: input.categories, q: input.q, tags: input.tags,
              limit: desired - received, cursor: previous_cursor, exclude_ids: opposite.ids, from: state.from })
            for (const article of page.data) {
              if (!article.id || seen_ids.has(article.id)) continue
              seen_ids.add(article.id)
              state.ids.push(article.id)
              batch.push(article)
              if (++received >= desired) break
            }
            state.cursor = page.next_cursor && !cursors.has(page.next_cursor) ? page.next_cursor : null
            state.exhausted = !state.cursor
          }
        } catch {
          failures.add(kind)
          error_message = 'Some news could not be loaded right now.'
        }
      }
      if (input.source_id) {
        try {
          const page = await beans.fetchSourceArticles(input.source_id, { limit: 5, cursor: source_cursor })
          batch.push(...page.data.filter((article) => {
            if (!article.id || article.source?.id !== input.source_id || seen_ids.has(article.id)) return false
            seen_ids.add(article.id)
            return true
          }))
          source_cursor = page.next_cursor !== source_cursor ? page.next_cursor : null
        } catch {
          error_message = 'News could not be loaded right now.'
        }
      } else if (input.feed_mode === 'trending') {
        await fetchStream('trending', 5)
      } else {
        await fetchStream('trending', 1)
        await fetchStream('latest', 4)
        const missing = Math.max(0, 5 - batch.length)
        if (missing && latest.exhausted && !trending.exhausted && !failures.has('trending')) await fetchStream('trending', missing)
        else if (missing && trending.exhausted && !latest.exhausted && !failures.has('latest')) await fetchStream('latest', missing)
      }
      trending.ids = trending.ids.slice(-2000)
      latest.ids = latest.ids.slice(-2000)
      return { articles: await enrichArticles(batch), trending, latest, source_cursor, source_exhausted: !source_cursor, error_message }
    }

    async function coverage(story_id: string): Promise<NewsPage<NewsArticle>> {
      const articles: NewsArticle[] = []
      const seen_ids = new Set<string>()
      const cursors = new Set<string>()
      let cursor: string | null = null
      for (let index = 0; index < MAX_COVERAGE_PAGES; index++) {
        const page = await beans.fetchStoryArticles(story_id, { limit: 100, cursor })
        for (const article of page.data) {
          if (seen_ids.has(article.id)) continue
          seen_ids.add(article.id)
          articles.push(article)
        }
        cursor = page.next_cursor
        if (!cursor || cursors.has(cursor)) return { data: articles, next_cursor: null }
        cursors.add(cursor)
      }
      throw createError({ statusCode: 503, statusMessage: 'Coverage could not be loaded right now.' })
    }

    async function executeAction(action: string, payload: unknown): Promise<unknown> {
      if (!Object.hasOwn(ACTION_INPUTS, action)) throw createError({ statusCode: 404, statusMessage: 'Unknown action.' })
      const parsed = ACTION_INPUTS[action as ActionName].safeParse(payload)
      if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid action input.' })
      // Parse in each branch to preserve the corresponding input type.
      switch (action) {
        case 'feed': return feed(ACTION_INPUTS.feed.parse(payload))
        case 'search': {
          const input = ACTION_INPUTS.search.parse(payload)
          const page = await beans.fetchSearchArticles({ ...input, limit: 5 })
          return { ...page, data: await enrichArticles(page.data) }
        }
        case 'source': {
          const { id } = ACTION_INPUTS.source.parse(payload)
          const source = await beans.fetchSource(id)
          if (!source.id) throw createError({ statusCode: 404, statusMessage: 'Source not found.' })
          return { source, feed: await feed({ source_id: id }) } satisfies SourceAction
        }
        case 'article': {
          const { id } = ACTION_INPUTS.article.parse(payload)
          const article = await beans.fetchArticle(id)
          if (!article.id || !article.title) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
          const empty: NewsPage<NewsArticle> = { data: [], next_cursor: null }
          let coverage_error: string | null = null
          let related_error: string | null = null
          const [confidence, coverage_page, related] = await Promise.all([
            espresso.fetchConfidence([id]).catch(() => ({})),
            article.story_id
              ? coverage(article.story_id).catch(() => {
                  coverage_error = 'Coverage could not be loaded right now.'
                  return empty
                })
              : empty,
            article.story_id
              ? beans.fetchStoryArticles(article.story_id, { limit: 5 }, { include_languages: true }).catch(() => {
                  related_error = 'Related articles could not be loaded right now.'
                  return empty
                })
              : empty
          ])
          return { article: { ...article, confidence: (confidence as Record<string, NewsArticle['confidence']>)[id] }, coverage: coverage_page, related, coverage_error, related_error } satisfies ArticleAction
        }
        case 'coverage': return coverage(ACTION_INPUTS.coverage.parse(payload).id)
        case 'related': {
          const { id, cursor } = ACTION_INPUTS.related.parse(payload)
          return beans.fetchStoryArticles(id, { limit: 5, cursor }, { include_languages: true })
        }
        case 'signals': return espresso.fetchSignals({ limit: 5 })
      }
    }
    return executeAction(action, payload)
  }
}
