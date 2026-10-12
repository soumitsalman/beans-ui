import type { FeedSnapshot } from '../app/types/discovery'
import type { NewsArticle, NewsStory, NewsPage, NewsSource } from '../app/types/news'

export interface FeedInput {
  categories?: string[]
  q?: string
  tags?: string[]
  source_id?: string
  cursor?: string | null
  from?: string
  source_cursor?: string | null
  seen_ids?: string[]
}

export interface StoryAction {
  story: NewsStory
  coverage: NewsPage<NewsArticle>
  related: NewsPage<NewsArticle>
  coverage_error: string | null
  related_error: string | null
}

export type StoryEnrichment = Pick<NewsStory, 'confidence' | 'other_publishers'>

export interface SourceAction {
  source: NewsSource
  feed: FeedSnapshot
}
