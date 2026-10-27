import type { ContinuationContext } from '../../shared/continuation'
import type { PreferenceValues } from '../../shared/userPreferences'
import { createPreferenceRepository } from '../database/repository'
import { getUserDatabase } from './userDatabase'
import { sessionUser } from './userSession'
import { withContinuation, continuationState, readContinuation } from './continuationAccess'
import type { H3Event } from 'h3'
import { createError, getHeader, setHeader } from 'h3'
import type { NewsArticle, NewsStory, NewsPage } from '../../app/types/news'
import type { FeedSnapshot } from '../../app/types/discovery'
import type { StoryAction, StoryEnrichment, FeedInput, SourceAction } from '#shared/actions'
import { ACTION_INPUTS } from './actionInput'
import type { ActionName } from './actionInput'
import { createBeansClient, createEspressoClient } from './beansClient'
import { fetchPresentationApi } from './proxyApi'
import { withActionDeadline } from './actionDeadline'
import { fetchGoogleTrendDefaults } from './googleTrends'
import { resolveTrendCountry } from './trendCountry'

const MAX_COVERAGE_PAGES = 100
const MAX_PUBLISHER_AVATARS = 3

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
    let _private_request = false
    const fetch_api = <T>(api: 'beans' | 'espresso', path: string, query = {}) => fetchPresentationApi<T>(
      api === 'beans' ? config.beans_api_base_url : config.espresso_api_base_url,
      path, query, config.cafecito_api_key, signal, _private_request
    )
    const beans = createBeansClient(fetch_api, config.public.default_score_threshold)
    const espresso = createEspressoClient(fetch_api)

    function publisherAvatars(articles: NewsArticle[], primary_source_id?: string | null) {
      const favicon_urls = new Set<string>()
      return articles.filter((article) => {
        const favicon_url = article.source?.favicon_url
        if (article.source?.id === primary_source_id || favicon_url == null || favicon_url === '' || favicon_urls.has(favicon_url)) return false
        favicon_urls.add(favicon_url)
        return true
      }).slice(0, MAX_PUBLISHER_AVATARS).map(article => ({ id: article.id, source: article.source, url: article.url }))
    }

    async function enrichArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
      const confidence = await espresso.fetchConfidence(articles.map(article => article.id)).catch(() => ({}))
      return Promise.all(articles.map(async (article) => {
        const page = article.story_id
          ? await beans.fetchStoryPublishers(article.story_id).catch(() => null)
          : null
        const publishers = publisherAvatars(page?.data ?? [], article.source?.id)
        return { ...article, confidence: (confidence as Record<string, NewsArticle['confidence']>)[article.id], other_publishers: publishers }
      }))
    }

    async function fetchStoryEnrichment(story_ids: string[]): Promise<Record<string, StoryEnrichment>> {
      const source_pages = await Promise.all(story_ids.map(id => beans.fetchStoryPublishers(id).catch(() => null)))
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
        const publishers = publisherAvatars(source_pages[index]?.data ?? [])
        return [story_id, { confidence: confidence[story_id], other_publishers: publishers }]
      }))
    }

    async function enrichStories(stories: NewsStory[]): Promise<NewsStory[]> {
      const enrichment = await fetchStoryEnrichment(stories.map(story => story.id))
      return stories.map(story => ({ ...story, ...enrichment[story.id] }))
    }

    async function feed(input: FeedInput): Promise<FeedSnapshot> {
      const categories = [...new Set((input.categories ?? []).flatMap(value => value.split(',')).map(value => value.trim().toLowerCase()).filter(Boolean))].sort()
      const home = !input.source_id && !categories.length
      let from = input.from ?? new Date(Date.now() - (home ? 3 : 7) * 86400000).toISOString().slice(0, 10)
      let default_tags: string[] | undefined
      let trend_country: string | undefined
      let personalized = false
      let preference_error: string | null = null
      let preference_version: number | undefined
      let filters: Partial<PreferenceValues> = { topic: input.q, tags: input.tags }
      const cursor = input.source_id ? input.source_cursor : input.cursor
      const surface = input.source_id ? 'source' : home ? 'home' : 'category'
      const context_id = input.source_id || (home ? 'home' : categories.join(','))
      if (cursor && input.continuation_token) {
        const saved = readContinuation(event, input.continuation_token, cursor, surface).criteria
        filters = saved.filters as Partial<PreferenceValues>
        personalized = saved.personalized === true
        preference_version = saved.preference_version as number | undefined
        from = saved.from as string
        default_tags = saved.default_tags as string[] | undefined
        trend_country = saved.trend_country as string | undefined
      } else if (home && !input.q?.trim() && !input.tags?.length && sessionUser(event)) {
        try {
          const preference = await createPreferenceRepository(getUserDatabase()).readPreference(sessionUser(event)!)
          if (preference) {
            filters = preference
            personalized = true
            preference_version = preference.version
          }
        } catch {
          // Keep public news readable, but never label unavailable personal state as empty.
          setHeader(event, 'x-beans-preferences-unavailable', 'true')
          preference_error = 'Preferences could not be loaded. Showing public news; your saved preference has not been changed. Please retry.'
        }
      }
      if (home && !personalized && !filters.topic?.trim() && !filters.tags?.length) {
        trend_country = trend_country ?? input.trend_country ?? resolveTrendCountry(getHeader(event, 'accept-language'))
        if (default_tags === undefined) {
          if (input.default_tags !== undefined) default_tags = input.default_tags
          else ({ default_tags, trend_country } = await fetchGoogleTrendDefaults(trend_country))
        }
      }
      _private_request = personalized
      const criteria = { filters, personalized, preference_version, from, default_tags, trend_country }
      // JSON round-trip gives initial and resumed requests the same optional-field shape.
      const context: ContinuationContext = { surface, context: context_id, criteria: JSON.parse(JSON.stringify(criteria)) }
      const previous = { articles: [], cursor: input.cursor ?? null, from, default_tags, trend_country, source_cursor: input.source_cursor ?? null, source_exhausted: !input.source_cursor, personalized, preference_version }
      try {
        const page = await withContinuation(event, context, cursor, input.continuation_token, async () => {
          const result = input.source_id
            ? await beans.fetchSourceArticles(input.source_id, { limit: 5, cursor })
            : await beans.fetchStories({ limit: 5, cursor, from, categories: categories.length ? categories : undefined, q: filters.topic, tags: personalized ? filters.tags : default_tags ?? filters.tags, domains: filters.domains, exclude_domains: filters.exclude_domains, languages: filters.languages }, personalized)
          signal.throwIfAborted()
          return result
        })
        const seen_ids = new Set(input.seen_ids ?? [])
        const articles = page.data.filter((article) => {
          if (!article.id || seen_ids.has(article.id) || (input.source_id && article.source?.id !== input.source_id)) return false
          seen_ids.add(article.id)
          return true
        })
        const next_cursor = page.next_cursor !== cursor ? page.next_cursor : null
        return {
          ...previous, articles: input.source_id ? await enrichArticles(articles) : articles,
          cursor: input.source_id ? null : next_cursor, source_cursor: input.source_id ? next_cursor : null,
          source_exhausted: input.source_id ? !next_cursor : true, error_message: preference_error,
          continuation_access: await continuationState(event, context, next_cursor)
        }
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode && [400, 401, 403, 409].includes((error as { statusCode: number }).statusCode)) throw error
        return { ...previous, error_message: 'News could not be loaded right now. Please retry.' }
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
          const criteria = { q: input.q?.trim().replaceAll(/\s+/g, ' ').toLowerCase() || '', tags: [...new Set((input.tags ?? []).flatMap(value => value.split(',')).map(value => value.trim().toLowerCase().replaceAll(/\s+/g, '_')).filter(Boolean))].sort(), domains: [...new Set((input.domains ?? []).flatMap(value => value.split(',')).map(value => value.trim().toLowerCase()).filter(Boolean))].sort() }
          const context: ContinuationContext = { surface: 'search', context: JSON.stringify(criteria), criteria }
          const page = await withContinuation(event, context, input.cursor, input.continuation_token, async () => {
            const result = await beans.fetchSearchArticles({ ...input, limit: 5 })
            signal.throwIfAborted()
            return result
          })
          const next_cursor = page.next_cursor !== input.cursor ? page.next_cursor : null
          return { ...page, next_cursor, data: await enrichArticles(page.data), continuation_access: await continuationState(event, context, next_cursor) }
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
          const context: ContinuationContext = { surface: 'related', context: id, criteria: { id } }
          return { story: enriched[0]!, coverage: coverage_page, related: { ...related, continuation_access: await continuationState(event, context, related.next_cursor) }, coverage_error, related_error } satisfies StoryAction
        }
        case 'story_enrichment': return fetchStoryEnrichment(ACTION_INPUTS.story_enrichment.parse(payload).ids)
        case 'coverage': return coverage(ACTION_INPUTS.coverage.parse(payload).id)
        case 'related': {
          const { id, cursor, continuation_token } = ACTION_INPUTS.related.parse(payload)
          const context: ContinuationContext = { surface: 'related', context: id, criteria: { id } }
          const page = await withContinuation(event, context, cursor, continuation_token, async () => {
            const result = await beans.fetchStoryArticles(id, { limit: 5, cursor }, { include_languages: true })
            signal.throwIfAborted()
            return result
          })
          const next_cursor = page.next_cursor !== cursor ? page.next_cursor : null
          return { ...page, next_cursor, continuation_access: await continuationState(event, context, next_cursor) }
        }
        case 'signals': return espresso.fetchSignals({ limit: 5 })
      }
    }
    return executeAction(action, payload)
  }
}
