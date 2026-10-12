import type {
  BeansArticle,
  BeansStory,
  NewsStory,
  BeansPageParams,
  EspressoConfidence,
  EspressoSignal,
  NewsArticle,
  NewsPage,
  NewsSource
} from '../../app/types/news'
import { defaultScoreThreshold, NEWS_LANGUAGES } from '#shared/news'

export type ApiFetch = <T>(api: 'beans' | 'espresso', path: string, query?: ApiQuery) => Promise<T>

interface ApiEnvelope<T> {
  data?: T
  pagination?: {
    next_cursor?: string | null
    num_results?: number | null
  } | null
}

interface ConfidenceRecord {
  id?: string | null
  confidence?: string | number | null
  confidence_score?: string | number | null
}

type ConfidencePayload = ConfidenceRecord[] | Record<string, ConfidenceRecord | string | null>
type ApiQuery = Record<string, string | number | string[] | undefined>

const DEFAULT_PAGE_SIZE = 5

function toConfidence(value?: string | number | null): EspressoConfidence | undefined {
  if (typeof value !== 'string') return undefined
  const confidence = value?.toLowerCase()
  return confidence === 'high' || confidence === 'medium' || confidence === 'low'
    ? confidence
    : undefined
}

function normaliseList(values?: string[] | null): string[] {
  return Array.isArray(values) ? values.filter(Boolean) : []
}

function serialiseQueryList(value?: string | string[]): string[] | undefined {
  if (Array.isArray(value)) return value.length ? value.filter(Boolean) : undefined
  const values = value?.split(',').filter(Boolean)
  return values?.length ? values : undefined
}

function serialiseIsoDate(value?: string): string | undefined {
  if (!value) return undefined
  return value.slice(0, 10)
}

function withEnglishNews(params: BeansPageParams = {}): BeansPageParams {
  return {
    ...params,
    languages: NEWS_LANGUAGES,
    content_type: 'news'
  }
}

function toNewsArticle(article: BeansArticle): NewsArticle {
  return {
    author: article.author?.trim() || undefined,
    id: article.id ?? '',
    title: article.title?.trim() || '',
    url: article.url,
    published_at: article.published_at,
    story_id: article.story_id,
    image_url: article.image_url,
    summary: article.summary,
    categories: normaliseList(article.categories),
    ideology: article.ideology,
    regions: normaliseList(article.regions),
    entities: normaliseList(article.entities),
    tags: normaliseList(article.tags),
    source: article.source,
    trend: article.trend ?? undefined
  }
}

function toNewsStory(story: BeansStory): NewsStory {
  return {
    ...toNewsArticle(story),
    story_id: story.id,
    source: undefined,
    url: undefined,
    published_at: story.last_published_at,
    last_published_at: story.last_published_at,
    article_count: story.article_count ?? story.artcles_count
  }
}

function toQuery(params: BeansPageParams = {}): ApiQuery {
  return {
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    cursor: params.cursor ?? undefined,
    exclude_ids: serialiseQueryList(params.exclude_ids),
    q: params.q,
    score_threshold: params.score_threshold,
    tags: serialiseQueryList(params.tags),
    sources: serialiseQueryList(params.sources),
    domains: serialiseQueryList(params.domains),
    categories: serialiseQueryList(params.categories),
    regions: serialiseQueryList(params.regions),
    entities: serialiseQueryList(params.entities),
    content_type: params.content_type,
    languages: serialiseQueryList(params.languages),
    sort: params.sort,
    from: serialiseIsoDate(params.from),
    to: serialiseIsoDate(params.to)
  }
}

function pageFrom<T>(response: ApiEnvelope<T[]>): NewsPage<T> {
  const data = Array.isArray(response.data) ? response.data : []
  const num_results = response.pagination?.num_results

  return {
    data,
    next_cursor: response.pagination?.next_cursor ?? null,
    num_results: num_results == null ? undefined : num_results
  }
}

function confidenceFromRecord(record: ConfidenceRecord | string | null): EspressoConfidence | undefined {
  if (typeof record === 'string') return toConfidence(record)
  return toConfidence(record?.confidence ?? record?.confidence_score)
}

function confidenceMap(payload?: ConfidencePayload): Record<string, EspressoConfidence> {
  const result: Record<string, EspressoConfidence> = {}
  if (!payload) return result

  if (Array.isArray(payload)) {
    for (const record of payload) {
      if (!record.id) continue
      const confidence = confidenceFromRecord(record)
      if (confidence) result[record.id] = confidence
    }
    return result
  }

  for (const [article_id, record] of Object.entries(payload)) {
    const confidence = confidenceFromRecord(record)
    if (confidence) result[article_id] = confidence
  }
  return result
}

export function createBeansClient(fetch_api: ApiFetch, score_threshold: unknown) {
  const default_score_threshold = defaultScoreThreshold(score_threshold)
  async function fetchBeansPage<T>(path: string, params: BeansPageParams = {}): Promise<NewsPage<T>> {
    return pageFrom(await fetch_api<ApiEnvelope<T[]>>('beans', path, toQuery(params)))
  }

  function withScoreThreshold(params: BeansPageParams): BeansPageParams {
    if (!params.q?.trim()) return { ...params, score_threshold: undefined }
    return {
      ...params,
      score_threshold: params.score_threshold ?? default_score_threshold
    }
  }

  async function fetchStories(params: BeansPageParams = {}): Promise<NewsPage<NewsStory>> {
    const page = await fetchBeansPage<BeansStory>('preview/stories', withEnglishNews(withScoreThreshold({
      limit: params.limit,
      cursor: params.cursor,
      from: params.from,
      categories: params.categories,
      q: params.q,
      tags: params.tags,
      score_threshold: params.score_threshold
    })))
    return { ...page, data: page.data.map(toNewsStory).filter(story => story.id) }
  }

  async function fetchSearchArticles(params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>('articles/search', withScoreThreshold({
      ...params,
      ...withEnglishNews(params),
      content_type: 'news'
    }))

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchStory(story_id: string): Promise<NewsStory> {
    const response = await fetch_api<ApiEnvelope<BeansStory>>('beans', `preview/stories/${story_id}`, {
      languages: NEWS_LANGUAGES, content_type: 'news'
    })
    return toNewsStory(response.data ?? {})
  }

  async function fetchStorySources(story_id: string): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`preview/stories/${story_id}/articles`, { limit: 20 })
    return { ...page, data: page.data.map(toNewsArticle).filter(article => article.id) }
  }

  async function fetchArticlePublishers(story_id: string): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`preview/stories/${story_id}/articles`, { limit: 50 })
    return { ...page, data: page.data.map(toNewsArticle).filter(article => article.id || article.url) }
  }

  async function fetchStoryArticles(
    story_id: string,
    params: BeansPageParams = {},
    filters: { include_languages?: boolean } = {}
  ): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`preview/stories/${story_id}/articles`, {
      ...params,
      ...(filters.include_languages ? { languages: NEWS_LANGUAGES, content_type: 'news' } : {})
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchSource(source_id: string): Promise<NewsSource> {
    const response = await fetch_api<ApiEnvelope<NewsSource>>('beans', `sources/${source_id}`)
    return response.data ?? {}
  }

  async function fetchSourceArticles(source_id: string, params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const source_params: BeansPageParams = {
      ...withEnglishNews(params),
      sort: 'recent',
      sources: [source_id],
      domains: undefined
    }
    let page = await fetchBeansPage<BeansArticle>('articles/latest', source_params)

    if (!page.data.length) {
      source_params.content_type = undefined
      page = await fetchBeansPage<BeansArticle>('articles/latest', source_params)
    }
    if (!page.data.length) {
      source_params.languages = undefined
      page = await fetchBeansPage<BeansArticle>('articles/latest', source_params)
    }

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  return {
    fetchStories,
    fetchSearchArticles,
    fetchStory,
    fetchStorySources,
    fetchArticlePublishers,
    fetchStoryArticles,
    fetchSource,
    fetchSourceArticles
  }
}

export function createEspressoClient(fetch_api: ApiFetch) {
  async function fetchSignals(params: BeansPageParams = {}): Promise<NewsPage<EspressoSignal>> {
    const response = await fetch_api<ApiEnvelope<EspressoSignal[]>>('espresso', 'signals', toQuery(params))

    return pageFrom(response)
  }

  async function fetchConfidence(article_ids: string[]): Promise<Record<string, EspressoConfidence>> {
    const ids = [...new Set(article_ids.filter(Boolean))]
    if (!ids.length) return {}

    const response = await fetch_api<ApiEnvelope<ConfidencePayload>>('espresso', 'preview/confidence', { ids: ids.join(',') })

    return confidenceMap(response.data)
  }

  return {
    fetchSignals,
    fetchConfidence
  }
}
