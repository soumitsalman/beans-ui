export interface NewsSource {
  id?: string | null
  description?: string | null
  base_url?: string | null
  url?: string | null
  site_name?: string | null
  domain_name?: string | null
  name?: string | null
  domain?: string | null
  favicon?: string | null
  favicon_url?: string | null
}

export interface NewsTrend {
  audiences?: number | null
  comments?: number | null
  likes?: number | null
  mentions?: number | null
  shares?: number | null
  related?: number | null
  trend_score?: number | null
}

export type EspressoConfidence = 'high' | 'medium' | 'low'

export interface BeansArticle {
  id?: string | null
  title?: string | null
  url?: string | null
  published_at?: string | null
  story_id?: string | null
  image_url?: string | null
  summary?: string | null
  content?: string | null
  content_type?: string | null
  categories?: string[] | null
  ideology?: string | null
  regions?: string[] | null
  entities?: string[] | null
  tags?: string[] | null
  source?: NewsSource | null
  trend?: NewsTrend | null
}

export interface NewsArticle {
  id: string
  title: string
  url?: string | null
  published_at?: string | null
  story_id?: string | null
  image_url?: string | null
  summary?: string | null
  categories: string[]
  ideology?: string | null
  regions: string[]
  entities: string[]
  tags: string[]
  source?: NewsSource | null
  trend?: NewsTrend | null
  confidence?: EspressoConfidence
  other_publishers?: NewsPublisher[]
}

export interface NewsPublisher {
  id: string
  source?: NewsSource | null
  url?: string | null
  trend?: NewsTrend | null
}

export interface NewsMention {
  platform?: string | null
  forum?: string | null
  observed_at?: string | null
  url?: string | null
  engagement?: {
    audience?: number | null
    comments?: number | null
    likes?: number | null
  } | null
}

export interface NewsPage<T> {
  data: T[]
  next_cursor: string | null
  num_results?: number
}

export interface BeansPageParams {
  sort?: 'trend' | 'recent'
  limit?: number
  cursor?: string | null
  exclude_ids?: string[]
  q?: string
  score_threshold?: number
  tags?: string[]
  sources?: string[]
  domains?: string[]
  categories?: string[]
  regions?: string[]
  entities?: string[]
  content_type?: string
  languages?: string | string[]
  from?: string
  to?: string
}

export interface EspressoSignal {
  id?: string | null
  created_at?: string | null
  summary?: string | null
  categories?: string[] | null
  companies?: string[] | null
  people?: string[] | null
  products?: string[] | null
  regions?: string[] | null
  impact_level?: string | null
  impacted_domains?: string[] | null
  confidence?: number | null
}
