import type { NewsArticle } from './news'

export interface FeedSnapshot {
  default_tags?: string[]
  trend_country?: string
  articles: NewsArticle[]
  error_message: string | null
  cursor: string | null
  from: string
  source_cursor: string | null
  source_exhausted: boolean
}

export interface PageMetadata {
  ready?: boolean
  original_article?: NewsArticle | null
  title: string
  description: string
  image?: string | null
  image_alt?: string
  path?: string
  kind?: 'WebPage' | 'CollectionPage'
  breadcrumbs?: { name: string, path: string }[]
}
