import { escapeXml, fetchDiscoveryArticles } from '../utils/discovery'

export default defineCachedEventHandler(async (event) => {
  const SITE_URL = useRuntimeConfig(event).public.site_url.replace(/\/+$/, '')
  let articles
  try {
    articles = await fetchDiscoveryArticles()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'News feed temporarily unavailable.' })
  }
  const items = articles.filter(article => article.story_id).map((article) => {
    const link = `${SITE_URL}/articles/${encodeURIComponent(article.id!)}`
    const published_at = article.published_at ? new Date(article.published_at) : undefined
    const date = published_at && !Number.isNaN(published_at.getTime()) ? `<pubDate>${published_at.toUTCString()}</pubDate>` : ''
    const source_name = article.source?.site_name || article.source?.name || article.source?.domain || 'Original publisher'
    return `<item><title>${escapeXml(article.title!)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><description>${escapeXml(`${source_name}: ${article.summary || 'Explore original reporting and related coverage on Beans.'}`)}</description>${date}</item>`
  }).join('\n')
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Beans latest news</title><link>${escapeXml(SITE_URL)}</link><description>Compare publisher news and related coverage on Beans.</description><language>en</language><atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
}, { maxAge: 300, swr: false })
