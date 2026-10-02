import type { NewsArticle } from '../types/news'
import type { CoverageOrbitSource, CoverageSource } from '../types/coverage'
import { sourceIdentity } from './source'

export const OPEN_ORBIT_ARTICLE_LIMIT = 8
export const WREATH_SOURCE_LIMIT = 12

export function coverageSources(articles: NewsArticle[]): CoverageSource[] {
  const sources = new Map<string, CoverageSource>()
  articles.forEach((article, index) => {
    const id = sourceIdentity(article) || article.id || article.url || `unknown-${index}`
    const existing_source = sources.get(id)
    if (existing_source) existing_source.article_count++
    else sources.set(id, { id, article, article_count: 1 })
  })
  return [...sources.values()]
}

export function positionCoverageSources(sources: CoverageSource[], page: number, page_size: number): CoverageOrbitSource[] {
  const page_sources = sources.slice(page * page_size, (page + 1) * page_size)
  return page_sources.map((source, index) => {
    const angle = index / page_sources.length * Math.PI * 2 - Math.PI / 2
    return {
      ...source,
      left_percent: 50 + Math.cos(angle) * 34,
      top_percent: 50 + Math.sin(angle) * 34
    }
  })
}
