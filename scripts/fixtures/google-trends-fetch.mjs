// Keep production HTTP checks deterministic and independent of Google access.
const FETCH = globalThis.fetch
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.hostname === 'trends.google.com') {
    const country = url.searchParams.get('geo')
    if (url.pathname !== '/trending/rss' || !['US', 'IN', 'BR'].includes(country)) throw new Error('Unexpected Google Trends request')
    if (country === 'BR') return Promise.resolve(new Response('<rss><channel/></rss>'))
    const xml = country === 'IN'
      ? '<rss><channel><item><title>India News</title></item></channel></rss>'
      : '<rss><channel><item><title>GTA 6</title></item><item><title>Space News</title></item></channel></rss>'
    return Promise.resolve(new Response(xml, {
      headers: { 'content-type': 'application/rss+xml' }
    }))
  }
  return FETCH(input, options)
}
