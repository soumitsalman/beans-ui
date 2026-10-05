import assert from 'node:assert/strict'
import { createServer, request } from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const MOCK_PORT = 4919
const APP_PORT = 4920
const BROWSER_PORT = 4921
const SITE_URL = 'https://beans.cafecito.tech'
const DEFAULT_SCORE_THRESHOLD = '0.55'
const REQUESTS = []
const EVENTS = []
const BROWSER_REQUESTS = []
const SOURCE = { id: 'source-1', site_name: 'Fixture News', description: 'Fixture publisher description.', url: 'https://publisher.example' }
const ARTICLES = Array.from({ length: 36 }, (_, index) => ({
  id: `article-${index + 1}`,
  story_id: index === 35 ? null : 'story-1',
  title: `Fixture news ${index + 1} & coverage`,
  author: index === 0 ? 'Fixture Reporter' : null,
  summary: index === 2 ? null : `Publisher summary ${index + 1}.${[0, 1, 3].includes(index) ? ' Compare [original reporting](https://publisher.example/context) across publishers for evidence, publication dates and the context behind this developing news story. This extended fixture description verifies that card summaries are cropped at two lines rather than increasing the card height without a limit.' : ''}`,
  url: `https://publisher.example/news/${index + 1}?existing=one&utm_source=old#section`,
  image_url: index === 0 ? '/beans-banner.png' : index === 3 ? '/missing-fixture-image.png' : null,
  source: SOURCE,
  published_at: new Date(Date.now() - index * 60000).toISOString(),
  categories: ['artificial_intelligence'],
  regions: [0, 1, 3].includes(index) ? ['north_america'] : [],
  entities: [0, 1, 3].includes(index) ? ['fixture_company'] : [], tags: [],
  trend: { related: 36, likes: 10 }
}))
let _fail_feed = true
let _fail_article = true
let _child_output = ''

// Browser-only fixture proxy: capture real app events without contacting Google Analytics.
const browser_server = createServer(async (request, response) => {
  if (request.url === '/__requests') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(BROWSER_REQUESTS))
    return
  }
  if (request.url === '/__events') {
    if (request.method === 'POST') {
      let body = ''
      for await (const chunk of request) body += chunk
      EVENTS.push(JSON.parse(body))
      response.writeHead(204).end()
    } else {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify(EVENTS))
    }
    return
  }
  if (request.url === '/__analytics.js') {
    response.setHeader('content-type', 'text/javascript')
    response.end(`
      window.dataLayer = window.dataLayer || [];
      const original_push = window.dataLayer.push.bind(window.dataLayer);
      function capture(entry) {
        if (entry[0] === 'event') {
          console.info('[fixture analytics]', JSON.stringify(Array.from(entry)));
          navigator.sendBeacon('/__events', JSON.stringify(Array.from(entry)));
        }
      }
      window.dataLayer.forEach(capture);
      window.dataLayer.push = function(entry) { capture(entry); return original_push(entry); };
      capture(['event', 'fixture_environment', { supported_entries: PerformanceObserver.supportedEntryTypes, visibility: document.visibilityState, visibility_entries: performance.getEntriesByType('visibility-state').map(entry => ({name:entry.name,time:entry.startTime})) }]);
      for (const type of ['paint', 'largest-contentful-paint', 'layout-shift', 'event']) {
        new PerformanceObserver(list => capture(['event', 'fixture_performance', {
          type, entries: list.getEntries().map(entry => ({ name: entry.name, start: entry.startTime, duration: entry.duration, value: entry.value, interaction_id: entry.interactionId, recent_input: entry.hadRecentInput }))
        }])).observe({ type, buffered: true, durationThreshold: 16 });
      }
    `)
    return
  }
  BROWSER_REQUESTS.push(new URL(request.url, `http://127.0.0.1:${BROWSER_PORT}`).pathname)
  try {
    const upstream = await fetch(`http://127.0.0.1:${APP_PORT}${request.url}`, {
      method: request.method,
      ...(request.method === 'POST' ? { body: request, duplex: 'half' } : {}),
      redirect: 'manual'
    })
    const headers = Object.fromEntries(upstream.headers)
    delete headers['content-length']
    delete headers['content-encoding']
    response.writeHead(upstream.status, headers)
    if (headers['content-type']?.includes('text/html')) {
      response.end((await upstream.text()).replace(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^" ]+/g, '/__analytics.js'))
    } else response.end(Buffer.from(await upstream.arrayBuffer()))
  } catch {
    response.writeHead(502).end('Fixture proxy unavailable')
  }
})

const mock_server = createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${MOCK_PORT}`)
  if (url.pathname === '/__requests') {
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(REQUESTS))
    return
  }
  REQUESTS.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), languages: url.searchParams.getAll('languages'), exclusions: url.searchParams.getAll('exclude_ids') })
  response.setHeader('content-type', 'application/json')
  if (url.pathname === '/private/articles/unique' && _fail_feed) {
    response.writeHead(500).end(JSON.stringify({ message: 'Fixture temporary outage.' }))
    return
  }
  if (url.pathname === '/private/articles/unique' && url.searchParams.get('q') === 'fail-discovery') {
    response.writeHead(500).end(JSON.stringify({ message: 'Fixture discovery failure.' }))
    return
  }
  if (url.pathname.startsWith('/articles/') && url.pathname !== '/articles/search') {
    const id = url.pathname.split('/').at(-1)
    if (id === 'temporary' && _fail_article) {
      response.writeHead(500).end(JSON.stringify({ message: 'Fixture temporary outage.' }))
      return
    }
    const article = id === 'temporary' ? ARTICLES[0] : ARTICLES.find(article => article.id === id)
    if (!article) response.writeHead(id === 'gone' ? 410 : 404).end(JSON.stringify({ message: 'Not found.' }))
    else response.end(JSON.stringify({ data: article }))
    return
  }
  if (url.pathname.startsWith('/sources/')) {
    if (url.pathname.endsWith('source-1')) response.end(JSON.stringify({ data: SOURCE }))
    else response.writeHead(404).end(JSON.stringify({ message: 'Source not found.' }))
    return
  }
  if (url.pathname === '/private/confidence') {
    response.end(JSON.stringify({ data: (url.searchParams.get('ids') || '').split(',').map(id => ({ id, confidence: 'high' })) }))
    return
  }
  if (url.pathname === '/private/articles/unique' || url.pathname === '/private/stories/story-1/articles' || url.pathname === '/articles/search') {
    const exclusions = new Set(url.searchParams.getAll('exclude_ids'))
    const fixture_articles = url.pathname === '/private/stories/story-1/articles' && process.env.BEANS_COVERAGE_FIXTURE
      ? ARTICLES.map((article, index) => ({
          ...article,
          published_at: process.env.BEANS_COVERAGE_FIXTURE === 'multi-day' && index === ARTICLES.length - 1
            ? '2026-10-03T12:00:00Z'
            : `2026-10-02T12:${String(index).padStart(2, '0')}:00Z`,
          source: { ...SOURCE, id: `source-${index % 7 + 1}`, site_name: `Fixture publisher ${index % 7 + 1}` }
        }))
      : ARTICLES
    const filtered = fixture_articles.filter(article => !exclusions.has(article.id))
    const limit = Number(url.searchParams.get('limit') || 5)
    const offset = Number(url.searchParams.get('cursor') || 0)
    const next_cursor = offset + limit < filtered.length ? String(offset + limit) : null
    response.end(JSON.stringify({ data: filtered.slice(offset, offset + limit), pagination: { next_cursor } }))
    return
  }
  response.writeHead(404).end(JSON.stringify({ message: 'Unknown fixture route.' }))
})

await new Promise((resolve, reject) => {
  mock_server.once('error', reject)
  mock_server.listen(MOCK_PORT, '127.0.0.1', resolve)
})
const app_process = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1', PORT: String(APP_PORT), NITRO_HOST: '127.0.0.1', NITRO_PORT: String(APP_PORT),
    NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NUXT_CAFECITO_API_KEY: 'fixture-only',
    NUXT_PUBLIC_SITE_URL: SITE_URL,
    NUXT_PUBLIC_GA_MEASUREMENT_ID: 'G-FIXTURE123',
    NUXT_PUBLIC_VITALS_REPORT_ALL_CHANGES: 'true',
    NUXT_PUBLIC_DEFAULT_SCORE_THRESHOLD: DEFAULT_SCORE_THRESHOLD
  },
  stdio: ['ignore', 'pipe', 'pipe']
})
app_process.stdout.on('data', (chunk) => {
  _child_output += chunk
})
app_process.stderr.on('data', (chunk) => {
  _child_output += chunk
})

function stopServers() {
  app_process.kill('SIGTERM')
  mock_server.close()
  browser_server.close()
}
process.once('SIGINT', stopServers)
process.once('SIGTERM', stopServers)

async function fetchPage(path, options) {
  const response = await fetch(`http://127.0.0.1:${APP_PORT}${path}`, options)
  return { response, html: await response.text() }
}

try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    if (app_process.exitCode !== null) throw new Error(`Production app exited: ${_child_output}`)
    try {
      const response = await fetch(`http://127.0.0.1:${APP_PORT}/about-beans`)
      if (response.ok) {
        ready = true
        break
      }
    } catch { /* Wait only until the production listener is available. */ }
    await delay(100)
  }
  assert.ok(ready, 'Production server became available')

  for (const path of ['/sitemap.xml', '/feed.xml']) {
    const { response } = await fetchPage(path)
    assert.equal(response.status, 503, `${path} does not cache an empty success on outage`)
  }
  const temporary = await fetchPage('/articles/temporary')
  assert.equal(temporary.response.status, 503)
  assert.equal(temporary.response.headers.get('cache-control'), 'private, no-store')
  assert.match(temporary.html, /Retry/)
  assert.match(temporary.html, /noindex, follow/)
  _fail_feed = false
  _fail_article = false

  const secure_page = await fetchPage('/about-beans', { headers: { 'x-forwarded-proto': 'https' } })
  assert.equal(secure_page.response.headers.get('strict-transport-security'), 'max-age=31536000')
  assert.equal(secure_page.response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(secure_page.response.headers.get('x-frame-options'), 'DENY')
  assert.ok(secure_page.response.headers.get('permissions-policy'))
  assert.ok(secure_page.response.headers.get('referrer-policy'))
  assert.match(secure_page.response.headers.get('content-security-policy'), /frame-ancestors 'none'/)
  assert.match(secure_page.response.headers.get('cache-control'), /must-revalidate/)
  assert.ok(secure_page.response.headers.get('etag'))
  const revalidated = await fetchPage('/about-beans', { headers: { 'if-none-match': secure_page.response.headers.get('etag') } })
  assert.equal(revalidated.response.status, 304, 'Unchanged HTML validates with an ETag')
  assert.equal(revalidated.html, '')

  for (const [path, headline] of [
    ['/', 'Fixture news 1 &amp; coverage'],
    ['/categories/tech-and-innovation', 'Fixture news 1 &amp; coverage'],
    ['/articles/article-1', 'Publisher summary 1.'],
    ['/sources/source-1', 'Fixture publisher description.']
  ]) {
    const { response, html } = await fetchPage(path)
    assert.equal(response.status, 200, path)
    assert.ok(html.includes(headline), `${path} content is present in initial HTML`)
    assert.equal((html.match(/<link\b[^>]*rel="canonical"/g) || []).length, 1)
    assert.ok(html.includes(`href="${SITE_URL}${path}"`), `${path} preferred canonical`)
    assert.ok(!html.includes('cafecito-beans-app.fly.dev'), `${path} has no old metadata origin`)
    assert.ok(!html.includes('fixture-only'), `${path} does not expose API credentials`)
    if (path === '/' || path.startsWith('/categories')) assert.equal((html.match(/<article(?:\s|>)/g) || []).length, 5)
    if (path === '/articles/article-1') {
      assert.match(html, /property="og:title" content="Fixture news 1 &(?:amp;)? coverage \| Beans coverage"/)
      assert.match(html, /aria-label="Copy link"/, 'Article detail renders direct sharing actions')
      assert.match(html, /aria-label="LinkedIn"/)
      assert.ok(!html.includes('Original reporting from'), 'Detail omits the visible attribution sentence')
      assert.match(html, /"creditText":"By Fixture Reporter"/, 'Original author credit remains in metadata')
      assert.match(html, /"datePublished":/, 'Original publication date is included in the citation')
      assert.ok(!html.includes('"dateModified"'), 'No modification date is invented')
    }
    assert.match(html, /href="#main-content"/)
    assert.match(html, /href="https:\/\/cafecito.tech\/docs\/privacy-policy\//)
    assert.match(html, /href="https:\/\/cafecito.tech\/docs\/terms-of-use\//)
    assert.match(html, /"@type":"ContactPoint"/)
    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(match[0], /\bwidth="\d+"/, 'Rendered images declare width')
      assert.match(match[0], /\bheight="\d+"/, 'Rendered images declare height')
    }
    for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) JSON.parse(match[1])
  }

  const request_count = REQUESTS.filter(request => request.path === '/private/articles/unique').length
  const warm_start = performance.now()
  const warm_home = await fetchPage('/')
  const warm_duration = performance.now() - warm_start
  assert.equal(REQUESTS.filter(request => request.path === '/private/articles/unique').length, request_count, 'Warm feed uses the bounded presentation cache')
  assert.match(warm_home.response.headers.get('cache-control'), /must-revalidate/)
  assert.match(warm_home.html, /What(?:'|&#39;)s on your mind\?/)
  assert.match(warm_home.html, /Discover Trending News/)
  assert.match(warm_home.html, /beans-icon-48.webp/)
  assert.match(warm_home.html, /srcset="[^"]*beans-icon-24.webp/)
  assert.ok(!warm_home.html.includes('Explore coverage'), 'Now stays focused on news')
  assert.ok(!warm_home.html.includes('How Beans works'), 'Explanations belong on About')
  const footer = warm_home.html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)[1]
  assert.ok(!footer.includes('href="/archive"') && !footer.includes('href="/feed.xml"') && !footer.includes('href="/methodology"'), 'Footer has one About destination')
  const about = await fetchPage('/about-beans')
  assert.match(about.html, /id="how-it-works"/)
  assert.match(about.html, /Original reporting stays with the publisher/)
  assert.match(about.html, /Before sharing a story/)
  const methodology = await fetchPage('/methodology', { redirect: 'manual' })
  assert.equal(methodology.response.status, 301)
  assert.equal(methodology.response.headers.get('location'), '/about-beans#how-it-works')
  const home_trend = REQUESTS.find(request => request.path === '/private/articles/unique' && request.query.sort === 'trend' && request.query.limit === '1' && !request.query.categories && !request.query.q)
  assert.ok(home_trend, 'Home fetches one trending article without a category filter')
  assert.equal(home_trend.query.tags, undefined, 'Default home trending omits tags')
  const home_latest = REQUESTS.find(request => request.path === '/private/articles/unique' && request.query.sort === 'recent' && request.query.limit === '4' && !request.query.categories && !request.query.q)
  assert.ok(home_latest, 'Home fetches four latest articles without a category filter')
  assert.equal(home_latest.query.tags, undefined, 'Default home latest omits tags')
  const discovery_from = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const discovery_url = `/api/beans/private/articles/unique?q=battery&tags=startups&score_threshold=0.6&content_type=news&from=${discovery_from}&limit=5`
  const discovery_before = REQUESTS.filter(request => request.query.q === 'battery').length
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}${discovery_url}`)).status, 200)
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}${discovery_url}`)).status, 200)
  assert.equal(REQUESTS.filter(request => request.query.q === 'battery').length, discovery_before + 1, 'Identical discovery searches reuse the 12-hour cache')
  const discovery_request = REQUESTS.find(request => request.query.q === 'battery')
  assert.equal(discovery_request.query.score_threshold, '0.6')
  assert.equal(discovery_request.query.from, discovery_from)
  assert.equal(discovery_request.query.sort, undefined)
  assert.equal(discovery_request.query.categories, undefined)
  const failure_before = REQUESTS.filter(request => request.query.q === 'fail-discovery').length
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}/api/beans/private/articles/unique?q=fail-discovery&score_threshold=0.6`)).status, 500)
  const failure_after_first = REQUESTS.filter(request => request.query.q === 'fail-discovery').length
  assert.ok(failure_after_first > failure_before, 'A discovery failure reaches the upstream API')
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}/api/beans/private/articles/unique?q=fail-discovery&score_threshold=0.6`)).status, 500)
  assert.ok(REQUESTS.filter(request => request.query.q === 'fail-discovery').length > failure_after_first, 'Discovery failures are not cached')
  const discovery_cookie = `beans_home_discovery=${encodeURIComponent(JSON.stringify({ query: 'battery', tags: ['startups'] }))}`
  const personalized_before = REQUESTS.filter(request => request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories).length
  const personalized = await fetchPage('/', { headers: { cookie: discovery_cookie } })
  assert.equal(personalized.response.status, 200)
  assert.equal(personalized.response.headers.get('cache-control'), 'private, no-store')
  assert.match(personalized.html, /battery/)
  assert.match(personalized.html, />Find</)
  assert.equal((personalized.html.match(/<article(?:\s|>)/g) || []).length, 5)
  const personalized_requests = REQUESTS.filter(request => request.path === '/private/articles/unique' && request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories)
  assert.ok(personalized_requests.some(request => request.query.sort === 'trend' && request.query.limit === '1' && request.query.score_threshold === DEFAULT_SCORE_THRESHOLD), 'A saved home search keeps the trending request')
  assert.ok(personalized_requests.some(request => request.query.sort === 'recent' && request.query.limit === '4' && request.query.score_threshold === DEFAULT_SCORE_THRESHOLD), 'A saved home search keeps the latest request')
  const personalized_after = personalized_requests.length
  assert.ok(personalized_after > personalized_before, 'A saved home search requests the category mix with the topic and tags')
  const personalized_again = await fetchPage('/', { headers: { cookie: discovery_cookie } })
  assert.equal(personalized_again.response.headers.get('cache-control'), 'private, no-store')
  assert.equal(REQUESTS.filter(request => request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories).length, personalized_after, 'Returning home reuses the cached discovery feed')
  const tags_cookie = `beans_home_discovery=${encodeURIComponent(JSON.stringify({ query: '', tags: ['energy'] }))}`
  const tags_home = await fetchPage('/', { headers: { cookie: tags_cookie } })
  assert.equal(tags_home.response.status, 200)
  assert.equal(tags_home.response.headers.get('cache-control'), 'private, no-store')
  const tags_requests = REQUESTS.filter(request => request.path === '/private/articles/unique' && request.query.tags === 'energy' && !request.query.q && !request.query.categories)
  assert.ok(tags_requests.some(request => request.query.sort === 'trend' && request.query.score_threshold === undefined), 'A tags-only home search keeps trending and omits the score threshold')
  assert.ok(tags_requests.some(request => request.query.sort === 'recent' && request.query.score_threshold === undefined), 'A tags-only home search keeps latest and omits the score threshold')
  console.log(`Warm home response: ${warm_duration.toFixed(1)} ms; no upstream feed fetches.`)

  for (const [path, expected] of [['/articles/missing', 404], ['/articles/gone', 410], ['/sources/missing', 404]]) {
    assert.equal((await fetchPage(path)).response.status, expected, path)
  }
  assert.equal((await fetchPage('/articles/temporary')).response.status, 200, 'An outage does not permanently mark an article missing')

  assert.equal((await fetchPage('/archive')).response.status, 404, 'Removed archive route is not served')

  const sitemap = await fetchPage('/sitemap.xml')
  assert.equal(sitemap.response.status, 200)
  assert.ok(!sitemap.html.includes('/archive'), 'Removed archive is absent from the sitemap')
  assert.match(sitemap.html, /\/articles\/article-1<\/loc>/)
  assert.match(sitemap.html, /\/sources\/source-1<\/loc>/)
  assert.ok(!sitemap.html.includes('/articles/article-36'), 'Story-less item is not advertised as coverage')
  const rss = await fetchPage('/feed.xml')
  assert.equal(rss.response.status, 200)
  assert.match(rss.html, /Fixture news 1 &amp; coverage/)
  assert.match(rss.html, /application\/rss\+xml/)
  assert.match((await fetchPage('/robots.txt')).html, /Sitemap: https:\/\/beans.cafecito.tech\/sitemap.xml/)
  const search_page = await fetchPage('/search?q=sensitive-query')
  assert.match(search_page.html, /content="noindex, follow"/)
  assert.equal(search_page.response.headers.get('cache-control'), 'private, no-store')
  assert.equal(REQUESTS.find(request => request.path === '/articles/search' && request.query.q === 'sensitive-query')?.query.score_threshold, DEFAULT_SCORE_THRESHOLD, 'Search uses the configured score threshold')
  await fetchPage('/search?tags=startups')
  assert.equal(REQUESTS.find(request => request.path === '/articles/search' && request.query.tags === 'startups' && !request.query.q)?.query.score_threshold, undefined, 'Tag-only search omits the score threshold')
  // Node fetch can override Host; use the HTTP client to exercise the actual host middleware.
  const redirect = await new Promise((resolve, reject) => {
    const redirect_request = request(`http://127.0.0.1:${APP_PORT}/articles/article-1?utm_campaign=test`, {
      headers: { host: 'cafecito-beans-app.fly.dev' }
    }, (response) => {
      response.resume()
      response.on('end', () => resolve(response))
    })
    redirect_request.on('error', reject)
    redirect_request.end()
  })
  assert.equal(redirect.statusCode, 308)
  assert.equal(redirect.headers.location, `${SITE_URL}/articles/article-1?utm_campaign=test`)
  const localhost = await fetchPage('/about-beans')
  assert.equal(localhost.response.status, 200, 'Localhost is not redirected')

  const latest_request = REQUESTS.find(request => request.path === '/private/articles/unique' && request.query.limit === '4')
  assert.ok(latest_request.exclusions.includes('article-1'), 'Latest excludes the server-rendered trending ID')
  assert.ok(latest_request.languages.includes('en'), 'Repeated English language keys retained')
  console.log('Discovery integration checks passed: SSR content, canonical/meta/JSON-LD, resource errors, removed archive, sitemap/RSS, host redirects and feed filters.')
  if (process.argv.includes('--serve')) {
    REQUESTS.length = 0
    await new Promise(resolve => browser_server.listen(BROWSER_PORT, '127.0.0.1', resolve))
    console.log(`Fixture browser: http://127.0.0.1:${BROWSER_PORT}; events: /__events; request log: http://127.0.0.1:${MOCK_PORT}/__requests`)
  } else stopServers()
} catch (error) {
  stopServers()
  console.error(error)
  console.error(_child_output.slice(-2500))
  process.exitCode = 1
}
