// Keep production HTTP checks deterministic and independent of Google access.
const FETCH = globalThis.fetch
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.hostname === 'trends.google.com') {
    if (url.pathname !== '/trending/rss' || url.searchParams.get('geo') !== 'US') throw new Error('Unexpected Google Trends request')
    return Promise.resolve(new Response('<rss><channel><item><title>GTA 6</title></item><item><title>Space News</title></item></channel></rss>', {
      headers: { 'content-type': 'application/rss+xml' }
    }))
  }
  return FETCH(input, options)
}
