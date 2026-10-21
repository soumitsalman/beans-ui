import { CATEGORY_GROUPS } from '../../app/settings/categories'
import { escapeXml } from '../utils/discovery'

export default defineCachedEventHandler((event) => {
  const runtime_config = useRuntimeConfig(event)
  const site_url = runtime_config.public.site_url.replace(/\/+$/, '')
  const paths = [
    '/',
    '/about-beans',
    ...CATEGORY_GROUPS.map(category => `/categories/${category.slug}`)
  ]
  const urls = paths.map(path => `  <url><loc>${escapeXml(`${site_url}${path}`)}</loc></url>`).join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}, { maxAge: 300, swr: false })
