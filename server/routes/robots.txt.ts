export default defineEventHandler((event) => {
  const runtime_config = useRuntimeConfig(event)
  const site_url = runtime_config.public.site_url.replace(/\/+$/, '')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site_url}/sitemap.xml`,
    ''
  ].join('\n')
})
