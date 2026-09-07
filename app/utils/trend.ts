import type { NewsTrend } from '~/types/news'
import { formatCount } from '~/utils/formatters'

export const TREND_SOCIAL_FIELDS = [
  { key: 'mentions', icon: 'lucide:message-circle', label: 'mentions' },
  { key: 'likes', icon: 'lucide:thumbs-up', label: 'likes' },
  { key: 'comments', icon: 'lucide:messages-square', label: 'comments' },
  { key: 'shares', icon: 'lucide:share-2', label: 'shares' }
] as const

export type TrendSocialKey = typeof TREND_SOCIAL_FIELDS[number]['key']

export interface TrendSocialCount {
  key: TrendSocialKey
  icon: (typeof TREND_SOCIAL_FIELDS)[number]['icon']
  label: (typeof TREND_SOCIAL_FIELDS)[number]['label']
  display: string
  value: number
}

export function hasPositiveCount(value?: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function hasTrendPayload(trend?: NewsTrend | null): boolean {
  if (!trend) return false

  return [
    trend.trend_score,
    trend.likes,
    trend.comments,
    trend.mentions,
    trend.shares,
    trend.audiences,
    trend.related
  ].some(value => value != null)
}

export function trendSocialCounts(trend?: NewsTrend | null): TrendSocialCount[] {
  if (!trend) return []

  return TREND_SOCIAL_FIELDS.flatMap((item) => {
    const value = trend[item.key]
    if (!hasPositiveCount(value)) return []

    return [{
      ...item,
      value,
      display: formatCount(value)
    }]
  })
}

export function overlayArticleTrend<T extends { trend?: NewsTrend | null }>(
  article: T,
  detailed_trend?: NewsTrend | null
): T {
  if (hasTrendPayload(article.trend) || !hasTrendPayload(detailed_trend)) return article

  return {
    ...article,
    trend: detailed_trend
  }
}
