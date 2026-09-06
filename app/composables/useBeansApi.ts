import type {
  BeansArticle,
  BeansPageParams,
  BeansStory,
  EspressoSignal,
  NewsArticle,
  NewsPage,
  NewsSource,
  NewsStory
} from '~/types/news'

interface ApiEnvelope<T> {
  data?: T
  pagination?: {
    next_cursor?: string | null
    num_results?: number | null
  } | null
}

type ApiQuery = Record<string, string | number | undefined>

const DEFAULT_PAGE_SIZE = 5

function normaliseList(values?: string[] | null): string[] {
  return Array.isArray(values) ? values.filter(Boolean) : []
}

function normaliseSource(source?: NewsSource | null): NewsSource | undefined {
  return source ?? undefined
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
    regions: normaliseList(article.regions),
    entities: normaliseList(article.entities),
    tags: normaliseList(article.tags),
    source: normaliseSource(article.source),
    trend: article.trend ?? undefined
  }
}

function toNewsStory(story: BeansStory): NewsStory {
  const articles = Array.isArray(story.top_articles)
    ? story.top_articles.map(toNewsArticle).filter(hasArticleIdentity)
    : []
  const top_article = [...articles]
    .filter(article => Boolean(article.title && article.summary))
    .sort((left, right) => {
      const summary_difference = (right.summary?.length ?? 0) - (left.summary?.length ?? 0)
      return summary_difference || (right.title.length - left.title.length)
    })[0] || articles[0]

  return {
    id: story.id ?? top_article?.story_id ?? top_article?.id ?? '',
    story_id: story.id ?? top_article?.story_id,
    title: top_article?.title || story.title?.trim() || '',
    url: top_article?.url,
    summary: top_article?.summary,
    image_url: top_article?.image_url,
    published_at: story.last_published_at ?? top_article?.published_at,
    first_published_at: story.first_published_at,
    last_published_at: story.last_published_at,
    categories: normaliseList(story.categories).length ? normaliseList(story.categories) : top_article?.categories ?? [],
    regions: normaliseList(story.regions).length ? normaliseList(story.regions) : top_article?.regions ?? [],
    entities: normaliseList(story.entities).length ? normaliseList(story.entities) : top_article?.entities ?? [],
    tags: normaliseList(story.tags).length ? normaliseList(story.tags) : top_article?.tags ?? [],
    source: top_article?.source,
    source_count: story.source_count ?? 0,
    article_count: story.article_count ?? 0,
    trend: top_article?.trend,
    top_articles: articles
  }
}

function hasArticleIdentity(article: NewsArticle): boolean {
  return Boolean(article.id || article.url)
}

function articleToStory(article: BeansArticle): NewsStory {
  const news_article = toNewsArticle(article)

  return {
    id: news_article.story_id || news_article.id || news_article.url || '',
    story_id: news_article.story_id,
    title: news_article.title,
    url: news_article.url,
    summary: news_article.summary,
    image_url: news_article.image_url,
    published_at: news_article.published_at,
    categories: news_article.categories,
    regions: news_article.regions,
    entities: news_article.entities,
    tags: news_article.tags,
    source: news_article.source,
    source_count: news_article.source ? 1 : 0,
    article_count: 1,
    trend: news_article.trend,
    top_articles: [news_article]
  }
}

function toQuery(params: BeansPageParams = {}): ApiQuery {
  return {
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
    cursor: params.cursor ?? undefined,
    q: params.q,
    score_threshold: params.score_threshold,
    tags: params.tags?.length ? params.tags.join(',') : undefined,
    sources: params.sources?.length ? params.sources.join(',') : undefined,
    domains: params.domains?.length ? params.domains.join(',') : undefined,
    categories: params.categories?.length ? params.categories.join(',') : undefined,
    regions: params.regions?.length ? params.regions.join(',') : undefined,
    entities: params.entities?.length ? params.entities.join(',') : undefined,
    content_type: params.content_type,
    from: params.from,
    to: params.to
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

export function useBeansApi() {
  async function fetchTopHeadlines(params: BeansPageParams = {}): Promise<NewsPage<NewsStory>> {
    const page = await fetchBeansPage<BeansArticle>('news/top-headlines', {
      ...params,
      content_type: undefined,
      from: undefined,
      to: undefined
    })

    return {
      ...page,
      data: page.data.map(articleToStory).filter(story => story.id)
    }
  }

  async function fetchLatestArticles(params: BeansPageParams = {}): Promise<NewsPage<NewsStory>> {
    const page = await fetchBeansPage<BeansArticle>('articles/latest', {
      ...params,
      content_type: 'news'
    })

    return {
      ...page,
      data: page.data.map(articleToStory).filter(story => story.id)
    }
  }

  async function fetchSearchArticles(params: BeansPageParams = {}): Promise<NewsPage<NewsStory>> {
    const page = await fetchBeansPage<BeansArticle>('articles/search', {
      ...params,
      score_threshold: params.q ? params.score_threshold ?? 0 : undefined,
      content_type: 'news'
    })

    return {
      ...page,
      data: page.data.map(articleToStory).filter(story => story.id)
    }
  }

  async function fetchArticle(article_id: string): Promise<NewsArticle> {
    const response = await $fetch<ApiEnvelope<BeansArticle>>(`/api/beans/articles/${article_id}`)
    return toNewsArticle(response.data ?? {})
  }

  async function fetchSimilarArticles(article_id: string, params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`articles/${article_id}/similar`, {
      ...params,
      content_type: 'news'
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(hasArticleIdentity)
    }
  }

  function fetchSources(params: BeansPageParams = {}): Promise<NewsPage<NewsSource>> {
    return fetchBeansPage<NewsSource>('sources', params)
  }

  async function fetchStory(story_id: string): Promise<NewsStory> {
    const response = await $fetch<ApiEnvelope<BeansStory>>(`/api/beans/stories/${story_id}`)

    return toNewsStory(response.data ?? {})
  }

  async function fetchStoryArticles(story_id: string, params: BeansPageParams = {}): Promise<NewsPage<NewsArticle>> {
    const page = await fetchBeansPage<BeansArticle>(`stories/${story_id}/articles`, {
      ...params,
      content_type: 'news'
    })

    return {
      ...page,
      data: page.data.map(toNewsArticle).filter(hasArticleIdentity)
    }
  }

  return {
    fetchTopHeadlines,
    fetchLatestArticles,
    fetchSearchArticles,
    fetchArticle,
    fetchSimilarArticles,
    fetchSources,
    fetchStory,
    fetchStoryArticles
  }
}

export function useEspressoApi() {
  async function fetchSignals(params: BeansPageParams = {}): Promise<NewsPage<EspressoSignal>> {
    const response = await $fetch<ApiEnvelope<EspressoSignal[]>>('/api/espresso/signals', {
      query: toQuery(params)
    })

    return pageFrom(response)
  }

  return {
    fetchSignals
  }
}
