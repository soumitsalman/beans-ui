import type {
  BeansArticle,
  BeansPageParams,
  EspressoConfidence,
  EspressoSignal,
  NewsArticle,
  NewsPage,
  NewsSource
} from '~/types/news'

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
type ApiQuery = Record<string, string | number | undefined>

const DEFAULT_PAGE_SIZE = 5
const NEWS_LANGUAGES = 'en'

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

function serialiseQueryList(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value.length ? value.join(',') : undefined
  return value
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

function toQuery(params: BeansPageParams = {}): ApiQuery {
  return {
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    cursor: params.cursor ?? undefined,
    exclude_ids: params.exclude_ids?.length ? params.exclude_ids.join(',') : undefined,
    q: params.q,
    score_threshold: params.score_threshold,
    tags: params.tags?.length ? params.tags.join(',') : undefined,
    sources: params.sources?.length ? params.sources.join(',') : undefined,
    domains: params.domains?.length ? params.domains.join(',') : undefined,
    categories: params.categories?.length ? params.categories.join(',') : undefined,
    regions: params.regions?.length ? params.regions.join(',') : undefined,
    entities: params.entities?.length ? params.entities.join(',') : undefined,
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

async function fetchBeansPage<T>(path: string, params: BeansPageParams = {}): Promise<NewsPage<T>> {
  const response = await $fetch<ApiEnvelope<T[]>>(`/api/beans/${path}`, {
    query: toQuery(params)
  })

  return pageFrom(response)
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

export function useBeansApi() {
  async function fetchTopHeadlines(params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>('private/articles/unique', {
      ...withEnglishNews(params),
      sort: 'trend',
      from: params.from ?? new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchLatestArticles(params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>('private/articles/unique', {
      ...withEnglishNews(params),
      sort: 'recent',
      from: params.from ?? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchSearchArticles(params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>('articles/search', {
      ...params,
      ...withEnglishNews(params),
      content_type: 'news',
      score_threshold: params.q ? params.score_threshold ?? 0 : undefined
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchArticle(article_id: string): Promise<NewsArticle> {
    const response = await $fetch<ApiEnvelope<BeansArticle>>(`/api/beans/articles/${article_id}`)
    return toNewsArticle(response.data ?? {})
  }

  async function fetchSimilarArticles(article_id: string, params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`private/articles/${article_id}/similar`, {
      ...withEnglishNews(params)
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  async function fetchSource(source_id: string): Promise<NewsSource> {
    const response = await $fetch<ApiEnvelope<NewsSource>>(`/api/beans/sources/${source_id}`)
    return response.data ?? {}
  }

  async function fetchSourceArticles(source_id: string, params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>('articles/latest', {
      ...withEnglishNews(params),
      sources: params.domains?.length ? undefined : [source_id]
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(article => article.id || article.url)
    }
  }

  return {
    fetchTopHeadlines,
    fetchLatestArticles,
    fetchSearchArticles,
    fetchArticle,
    fetchSimilarArticles,
    fetchSource,
    fetchSourceArticles
  }
}

export function useEspressoApi() {
  async function fetchSignals(params: BeansPageParams = {}): Promise<NewsPage<EspressoSignal>> {
    const response = await $fetch<ApiEnvelope<EspressoSignal[]>>('/api/espresso/signals', {
      query: toQuery(params)
    })

    return pageFrom(response)
  }

  async function fetchConfidence(article_ids: string[]): Promise<Record<string, EspressoConfidence>> {
    const ids = [...new Set(article_ids.filter(Boolean))]
    if (!ids.length) return {}

    const response = await $fetch<ApiEnvelope<ConfidencePayload>>('/api/espresso/private/confidence', {
      query: { ids: ids.join(',') }
    })

    return confidenceMap(response.data)
  }

  return {
    fetchSignals,
    fetchConfidence
  }
}
