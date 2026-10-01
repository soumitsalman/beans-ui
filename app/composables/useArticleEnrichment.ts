import type { EspressoConfidence, NewsArticle, NewsPublisher } from '~/types/news'

const MAX_PUBLISHERS = 5
const STORY_ARTICLE_PAGE_SIZE = 50

export function useArticleEnrichment() {
  const { fetchStoryArticles } = useBeansApi()
  const { fetchConfidence } = useEspressoApi()

  async function fetchOtherPublishers(article: NewsArticle): Promise<NewsPublisher[]> {
    if (!article.story_id) return []

    const primary_source_id = article.source?.id
    const seen_sources = new Set<string>()
    const publishers: NewsPublisher[] = []

    const page = await fetchStoryArticles(article.story_id, { limit: STORY_ARTICLE_PAGE_SIZE })
    for (const story_article of page.data) {
      const source_id = story_article.source?.id
      if (!source_id || source_id === primary_source_id || seen_sources.has(source_id)) continue
      seen_sources.add(source_id)
      publishers.push({
        id: story_article.id,
        source: story_article.source,
        url: story_article.url
      })
      if (publishers.length >= MAX_PUBLISHERS) break
    }

    return publishers
  }

  async function enrichArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
    const [confidence_by_id, publisher_results] = await Promise.all([
      fetchConfidence(articles.map(article => article.id)).catch(() => ({} as Record<string, EspressoConfidence>)),
      Promise.all(articles.map(article => fetchOtherPublishers(article).catch(() => [])))
    ])

    return articles.map((article, index) => ({
      ...article,
      confidence: confidence_by_id[article.id],
      other_publishers: publisher_results[index] ?? []
    }))
  }

  return { enrichArticles }
}
