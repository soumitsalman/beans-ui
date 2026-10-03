import type { NewsArticle } from './news'

export interface FeedStreamSnapshot {
  cursor: string | null
  exhausted: boolean
  ids: string[]
  from: string
}

export interface FeedSnapshot {
  articles: NewsArticle[]
  error_message: string | null
  trending: FeedStreamSnapshot
  latest: FeedStreamSnapshot
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
