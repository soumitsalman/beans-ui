import type { BeansArticle } from '../../app/types/news'
import { NEWS_LANGUAGES } from '#shared/news'

export function escapeXml(value: string): string {
  // XML 1.0 excludes these control characters even when encoded as entities.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[<>&'"\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
  })[character] || '')
}

export async function fetchDiscoveryArticles(): Promise<BeansArticle[]> {
  const response = await $fetch<{ data?: BeansArticle[] }>('/api/beans/private/articles/unique', {
    query: {
      sort: 'recent',
      content_type: 'news',
      languages: NEWS_LANGUAGES,
      limit: 100,
      from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    }
  })
  return (response.data || []).filter(article => article.id && article.title?.trim())
}
