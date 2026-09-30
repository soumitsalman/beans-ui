import type { EspressoConfidence, NewsArticle, NewsPublisher } from '~/types/news'
import { sourceIdentity } from '~/utils/source'

const MAX_PUBLISHERS = 5
const SIMILAR_PAGE_SIZE = 20

export function useArticleEnrichment() {
  const { fetchSimilarArticles } = useBeansApi()
  const { fetchConfidence } = useEspressoApi()

  async function fetchOtherPublishers(article: NewsArticle): Promise<NewsPublisher[]> {
    if (!article.id) return []

    const primary_source = sourceIdentity(article)
    const seen_sources = new Set<string>()
    const publishers: NewsPublisher[] = []
    let cursor: string | null = null

    while (publishers.length < MAX_PUBLISHERS) {
      const page = await fetchSimilarArticles(article.id, {
        limit: SIMILAR_PAGE_SIZE,
        cursor: cursor ?? undefined
      })

      for (const similar_article of page.data) {
        const source_key = sourceIdentity(similar_article)
        if (!source_key || source_key === primary_source || seen_sources.has(source_key)) continue
        seen_sources.add(source_key)
        publishers.push({
          id: similar_article.id,
          source: similar_article.source,
          url: similar_article.url
        })
        if (publishers.length >= MAX_PUBLISHERS) break
      }

      const next_cursor = page.next_cursor
      if (!next_cursor || next_cursor === cursor) break
      cursor = next_cursor
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
