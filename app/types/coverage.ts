import type { NewsArticle } from './news'

export interface CoverageSource {
  id: string
  article: NewsArticle
  article_count: number
}

export interface CoverageOrbitSource extends CoverageSource {
  left_percent: number
  top_percent: number
}
