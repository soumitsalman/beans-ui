import type { NewsArticle } from '../types/news'

export function sharedCoverageDate(articles: Pick<NewsArticle, 'published_at'>[]): string | undefined {
  if (!articles.length) return undefined
  const dates = articles.map((article) => {
    const date = new Date(article.published_at || '')
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
  })
  const first_date = dates[0]
  return first_date && dates.every(date => date === first_date) ? first_date : undefined
}
