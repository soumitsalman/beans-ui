import type { FeedSnapshot, FeedStreamSnapshot } from '../app/types/discovery'
import type { NewsArticle, NewsPage, NewsSource } from '../app/types/news'

export interface FeedInput {
  categories?: string[]
  q?: string
  tags?: string[]
  source_id?: string
  feed_mode?: 'mixed' | 'trending'
  trending?: FeedStreamSnapshot
  latest?: FeedStreamSnapshot
  source_cursor?: string | null
  seen_ids?: string[]
}

export interface ArticleAction {
  article: NewsArticle
  coverage: NewsPage<NewsArticle>
  related: NewsPage<NewsArticle>
  coverage_error: string | null
  related_error: string | null
}

export interface SourceAction {
  source: NewsSource
  feed: FeedSnapshot
}
