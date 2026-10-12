import type { H3Event } from 'h3'
import { createError, setHeader } from 'h3'
import type { NewsArticle, NewsStory, NewsPage } from '../../app/types/news'
import type { FeedSnapshot } from '../../app/types/discovery'
import type { StoryAction, StoryEnrichment, FeedInput, SourceAction } from '#shared/actions'
import { ACTION_INPUTS } from './actionInput'
import type { ActionName } from './actionInput'
import { createBeansClient, createEspressoClient } from './beansClient'
import { fetchPresentationApi } from './proxyApi'
import { withActionDeadline } from './actionDeadline'
import { sourceFavicon } from '../../app/utils/source'

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
          ? await beans.fetchArticlePublishers(article.story_id).catch(() => null)
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

    async function fetchStoryEnrichment(story_ids: string[]): Promise<Record<string, StoryEnrichment>> {
      const source_pages = await Promise.all(story_ids.map(id => beans.fetchStorySources(id).catch(() => null)))
      const article_ids = source_pages.map(page => [...new Set((page?.data ?? []).map(article => article.id).filter(Boolean))])
      const confidence: Record<string, NewsArticle['confidence']> = {}
      const scores = { low: 1, medium: 2, high: 3 }
      const queried_ids = new Set<string>()
      while (true) {
        const pending_ids = [...new Set(article_ids.flatMap((ids, index) => confidence[story_ids[index]!]
          ? []
          : ids.filter(id => !queried_ids.has(id))))].slice(0, 100)
        if (!pending_ids.length) break
        pending_ids.forEach(id => queried_ids.add(id))
        const values = await espresso.fetchConfidence(pending_ids).catch(() => ({}))
        for (const [index, ids] of article_ids.entries()) {
          for (const id of ids) {
            const value = (values as Record<string, NewsArticle['confidence']>)[id]
            const story_id = story_ids[index]!
            const previous = confidence[story_id]
            if (value && (!previous || scores[value] > scores[previous])) confidence[story_id] = value
          }
        }
      }
      return Object.fromEntries(story_ids.map((story_id, index) => {
        const favicons = new Set<string>()
        const publishers = (source_pages[index]?.data ?? []).filter((article) => {
          const favicon = sourceFavicon(article)
          if (!favicon || favicons.has(favicon)) return false
          favicons.add(favicon)
          return true
        }).slice(0, 5).map(article => ({ id: article.id, source: article.source, url: article.url }))
        return [story_id, { confidence: confidence[story_id], other_publishers: publishers }]
      }))
    }

    async function enrichStories(stories: NewsStory[]): Promise<NewsStory[]> {
      const enrichment = await fetchStoryEnrichment(stories.map(story => story.id))
      return stories.map(story => ({ ...story, ...enrichment[story.id] }))
    }

    async function feed(input: FeedInput): Promise<FeedSnapshot> {
      const from = input.from ?? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const seen_ids = new Set(input.seen_ids ?? [])
      let cursor = input.cursor ?? null
      let source_cursor = input.source_cursor ?? null
      try {
        const page = input.source_id
          ? await beans.fetchSourceArticles(input.source_id, { limit: 5, cursor: source_cursor })
          : await beans.fetchStories({ limit: 5, cursor, from, categories: input.categories, q: input.q, tags: input.tags })
        const articles = page.data.filter((article) => {
          if (!article.id || seen_ids.has(article.id) || (input.source_id && article.source?.id !== input.source_id)) return false
          seen_ids.add(article.id)
          return true
        })
        if (input.source_id) source_cursor = page.next_cursor !== source_cursor ? page.next_cursor : null
        else cursor = page.next_cursor !== cursor ? page.next_cursor : null
        return {
          articles: input.source_id ? await enrichArticles(articles) : articles,
          cursor, from, source_cursor, source_exhausted: !source_cursor, error_message: null
        }
      } catch {
        return { articles: [], cursor, from, source_cursor, source_exhausted: !source_cursor, error_message: 'News could not be loaded right now.' }
      }
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
        case 'story': {
          const { id } = ACTION_INPUTS.story.parse(payload)
          const story = await beans.fetchStory(id)
          if (!story.id || !story.title) throw createError({ statusCode: 404, statusMessage: 'Story not found.' })
          const empty: NewsPage<NewsArticle> = { data: [], next_cursor: null }
          let coverage_error: string | null = null
          let related_error: string | null = null
          const [enriched, coverage_page, related] = await Promise.all([
            enrichStories([story]),
            story.id
              ? coverage(story.id).catch(() => {
                  coverage_error = 'Coverage could not be loaded right now.'
                  return empty
                })
              : empty,
            story.id
              ? beans.fetchStoryArticles(story.id, { limit: 5 }, { include_languages: true }).catch(() => {
                  related_error = 'Related articles could not be loaded right now.'
                  return empty
                })
              : empty
          ])
          return { story: enriched[0]!, coverage: coverage_page, related, coverage_error, related_error } satisfies StoryAction
        }
        case 'story_enrichment': return fetchStoryEnrichment(ACTION_INPUTS.story_enrichment.parse(payload).ids)
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
