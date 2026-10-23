import assert from 'node:assert/strict'
import { glob, readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import Negotiator from 'negotiator'

async function loadService(path, bindings, names) {
  const source = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*\n/gm, '').replace(/^export /gm, '')
    .replaceAll('import.meta.server', 'false')
  return new Function(...Object.keys(bindings), `${source}\nreturn { ${names.join(', ')} };`)(...Object.values(bindings))
}

let _cache_options
const { resolveTrendCountry } = await loadService('../server/utils/trendCountry.ts', { Negotiator }, ['resolveTrendCountry'])
for (const [header, country] of [
  ['en-IN', 'IN'], ['pt-BR', 'BR'], ['zh-Hant-TW', 'TW'], ['en-in', 'IN'],
  ['en-US;q=0.2,pt-BR;q=0.9', 'BR'], ['en-US;q=0,en-IN;q=1', 'IN'],
  ['*,en;q=0.9', 'US'], ['bad_@@,fr-CA;q=0.8', 'CA'], ['en', 'US'], ['', 'US'],
  ['es-419,en-GB;q=0.5', 'GB']
]) assert.equal(resolveTrendCountry(header), country, header)
let _fetch_options
let _fetch_url
let _xml = '<rss><channel><item><title>GTA 6</title><ht:news_item><ht:news_item_title>Excluded headline</ht:news_item_title></ht:news_item></item><item><title>Sam&apos;s Club &amp; News</title></item><item><title>GTA 6</title></item><item><title> </title></item></channel></rss>'
const { parseGoogleTrendTags, fetchGoogleTrendTags } = await loadService('../server/utils/googleTrends.ts', {
  XMLParser, XMLValidator,
  defineCachedFunction: (fn, options) => {
    _cache_options = options
    return fn
  },
  $fetch: async (url, options) => {
    _fetch_url = url
    _fetch_options = options
    return _xml
  }
}, ['parseGoogleTrendTags', 'fetchGoogleTrendTags'])
assert.deepEqual(await fetchGoogleTrendTags(), ['GTA 6', 'Sam\'s Club & News'])
assert.equal(_fetch_url, 'https://trends.google.com/trending/rss')
assert.equal(_fetch_options.query.geo, 'US')
await fetchGoogleTrendTags('in')
assert.equal(_fetch_options.query.geo, 'IN')
assert.equal(_cache_options.getKey('in'), 'IN')
assert.equal(_fetch_options.retry, 0)
assert.equal(_fetch_options.timeout, 10000)
assert.equal(_cache_options.maxAge, 21600)
assert.equal(_cache_options.swr, false)
assert.deepEqual(parseGoogleTrendTags('<rss><channel><item><title><![CDATA[AI & Space]]></title></item></channel></rss>'), ['AI & Space'])
for (const xml of ['<rss><channel/></rss>', '<html>Blocked</html>', '<rss>']) {
  _xml = xml
  await assert.rejects(fetchGoogleTrendTags(), 'Empty or malformed results reject before reaching the cache')
}

// Exercise the installed Nitro cache implementation against isolated storage
// and a controlled clock, rather than duplicating its expiry logic in a mock.
let cache_path
for await (const path of glob('node_modules/.pnpm/nitropack*/node_modules/nitropack/dist/runtime/internal/cache.mjs')) cache_path = path
assert.ok(cache_path)
const cache_source = (await readFile(cache_path, 'utf8')).replace(/^import [\s\S]*?;\n/gm, '').replace(/^export /gm, '')
const STORAGE = new Map()
let _now = Date.now()
const { defineCachedFunction } = new Function('useStorage', 'hash', 'isEvent', 'Date', `${cache_source}\nreturn { defineCachedFunction };`)(
  () => ({
    getItem: async key => structuredClone(STORAGE.get(key)),
    setItem: async (key, value) => { STORAGE.set(key, structuredClone(value)) }
  }),
  () => 'fixture-integrity', () => false, { now: () => _now }
)
let _fetch_count = 0
let _cache_xml = '<rss><channel><item><title>First Trend</title></item></channel></rss>'
const cached = await loadService('../server/utils/googleTrends.ts', {
  XMLParser, XMLValidator, defineCachedFunction,
  $fetch: async () => {
    _fetch_count++
    return _cache_xml
  }
}, ['fetchGoogleTrendTags'])
assert.deepEqual(await cached.fetchGoogleTrendTags(), ['First Trend'])
_cache_xml = '<rss><channel><item><title>Second Trend</title></item></channel></rss>'
_now += 21600 * 1000 - 1
assert.deepEqual(await cached.fetchGoogleTrendTags(), ['First Trend'])
assert.equal(_fetch_count, 1)
_now += 2
assert.deepEqual(await cached.fetchGoogleTrendTags(), ['Second Trend'])
assert.equal(_fetch_count, 2, 'Expired tags refresh synchronously after six hours')
_now += 21600 * 1000 + 1
_cache_xml = '<rss><channel/></rss>'
await assert.rejects(cached.fetchGoogleTrendTags())
await assert.rejects(cached.fetchGoogleTrendTags())
assert.equal(_fetch_count, 4, 'Empty results are not cached')
_cache_xml = '<rss><channel><item><title>Canada Trend</title></item></channel></rss>'
assert.deepEqual(await cached.fetchGoogleTrendTags('CA'), ['Canada Trend'])
_cache_xml = '<rss><channel><item><title>India Trend</title></item></channel></rss>'
assert.deepEqual(await cached.fetchGoogleTrendTags('IN'), ['India Trend'])
assert.deepEqual(await cached.fetchGoogleTrendTags('ca'), ['Canada Trend'])

const fallback_calls = []
let fail_us = false
const fallback_source = (await readFile(new URL('../server/utils/googleTrends.ts', import.meta.url), 'utf8')).split('export async function fetchGoogleTrendDefaults')[1]
const fetchDefaults = new Function('normaliseTrendCountry', 'fetchGoogleTrendTags', `${stripTypeScriptTypes(`async function fetchGoogleTrendDefaults${fallback_source}`)}\nreturn fetchGoogleTrendDefaults;`)(
  country => country.toUpperCase(), async (country) => {
    fallback_calls.push(country)
    if (country !== 'US' || fail_us) throw new Error('Unavailable')
    return ['US fallback']
  }
)
assert.deepEqual(await fetchDefaults('IN'), { default_tags: ['US fallback'], trend_country: 'US' })
assert.deepEqual(fallback_calls, ['IN', 'US'])
fail_us = true
assert.deepEqual(await fetchDefaults('IN'), { default_tags: [], trend_country: 'US' })
fallback_calls.length = 0
assert.deepEqual(await fetchDefaults('US'), { default_tags: [], trend_country: 'US' })
assert.deepEqual(fallback_calls, ['US'])

const ref = value => ({ value })
const computed = getter => ({
  get value() { return getter() }
})
const unref = value => value && typeof value === 'object' && 'value' in value ? value.value : value
const REQUESTS = []
let _payload
let _hydrate = false
let _fail = false
let _tags = ['GTA 6']
const { useNewsFeed } = await loadService('../app/composables/useNewsFeed.ts', {
  computed, ref, unref, nextTick: async () => {}, onMounted: () => {}, onScopeDispose: () => {},
  useRoute: () => ({ path: '/' }), requestErrorMessage: () => 'Failed', logClientEvent: () => {},
  useAsyncData: async (key, handler) => {
    if (!_hydrate) _payload = await handler()
    return { data: ref(_payload) }
  },
  useBeansActions: () => ({ executeAction: async (action, input) => {
    if (action !== 'feed') return {}
    REQUESTS.push(input)
    return { articles: _fail ? [] : [{ id: String(REQUESTS.length) }], cursor: _fail ? input.cursor : input.cursor ?? 'next',
      from: input.from ?? '2026-10-12', default_tags: input.default_tags ?? _tags, trend_country: input.trend_country ?? 'IN',
      error_message: _fail ? 'Failed' : null }
  } })
}, ['useNewsFeed'])
const feed = useNewsFeed()
await feed.initialiseFeed()
assert.equal(REQUESTS[0].home_default, true)
assert.deepEqual(_payload.default_tags, ['GTA 6'])
assert.equal(_payload.trend_country, 'IN')
_hydrate = true
const hydrated = useNewsFeed()
await hydrated.initialiseFeed()
assert.equal(REQUESTS.length, 1, 'Hydration reuses the SSR payload')
_tags = ['new_trend']
await hydrated.loadMore()
assert.deepEqual(REQUESTS.at(-1).default_tags, ['GTA 6'])
assert.equal(REQUESTS.at(-1).trend_country, 'IN')
assert.equal(REQUESTS.at(-1).from, '2026-10-12')
_fail = true
await hydrated.refreshFeed()
assert.ok(hydrated.articles.value.length, 'A failed refresh preserves visible stories')
_tags = ['third_trend']
_fail = false
await hydrated.retryFeed()
assert.deepEqual(REQUESTS.at(-1).default_tags, ['new_trend'], 'Refresh Retry reuses the failed batch tags')
assert.equal(REQUESTS.at(-1).cursor, undefined, 'Refresh Retry does not reuse an old continuation cursor')

let _cookie = ref({ query: 'saved', tags: ['saved_tag'] })
const route = { path: '/', query: {} }
const { useHomeDiscovery } = await loadService('../app/composables/useHomeDiscovery.ts', {
  computed, ref, reactive: value => value, watch: () => {}, useNewsFeed,
  HOME_DISCOVERY_COOKIE: 'beans_home_discovery', useCookie: () => _cookie,
  useRoute: () => route, useRouter: () => ({ replace: async (value) => { route.query = value.query } }),
  useNuxtApp: () => ({ isHydrating: false }), useGoogleAnalytics: () => ({ trackEvent: () => {} }),
  useActionCooldown: () => ({ action_blocked: ref(false) }),
  normaliseTagInput: values => Array.isArray(values) ? values : values ? [values] : []
}, ['useHomeDiscovery'])
const home = useHomeDiscovery()
await home.start()
assert.equal(home.search_form.query, 'saved')
await home.clearSearch()
assert.equal(home.search_form.query, '')
assert.equal(_cookie.value, null)
assert.deepEqual(route.query, {})
assert.equal(REQUESTS.at(-1).q, undefined)
assert.equal(REQUESTS.at(-1).default_tags, undefined, 'Clear resolves fresh default tags')
await home.find()
assert.equal(REQUESTS.at(-1).q, undefined)
assert.equal(_cookie.value, null)
console.log('Google trends checks passed: XML/entities, original keyword spelling/spaces/punctuation, actual Nitro six-hour expiry and rejection of unusable results, SSR hydration, pagination, Retry, Clear and empty Find.')
