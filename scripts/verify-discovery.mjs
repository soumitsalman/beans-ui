import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createUserDatabase } from '../server/database/database.ts'
import { migrateUserDatabase } from '../server/database/migrations.ts'
import { randomUUID } from 'node:crypto'
import { signIdentity } from '../server/utils/anonymousIdentity.ts'
import { NEWS_LANGUAGES } from '../shared/news.ts'
import { createServer, request } from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const USER_FIXTURE_DIR = await mkdtemp(join(tmpdir(), 'beans-discovery-users-'))
const USER_FIXTURE_CONNECTION = `sqlite:${join(USER_FIXTURE_DIR, 'users.sqlite')}`
const user_database = createUserDatabase(USER_FIXTURE_CONNECTION)
await migrateUserDatabase(user_database)
await user_database.destroy()
const CONTINUATION_COOKIES = new Map()

const RATE_SECRET = process.env.TEST_RATE_LIMIT_COOKIE_SECRET || `discovery-fixture:${randomUUID()}`
function fixtureCookie() {
  return `beans_anonymous_id=${signIdentity(randomUUID(), Date.now(), RATE_SECRET)}`
}

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
const STORIES = ARTICLES.map((article, index) => ({ ...article, id: `story-${index + 1}`, last_published_at: article.published_at, article_count: 36, source: undefined, url: undefined }))
let _fail_feed = true
let _fail_article = true
let _child_output = ''
let _cooldown_fixture_sent = false

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
    let body
    if (request.method === 'POST') {
      body = ''
      for await (const chunk of request) body += chunk
    }
    if (process.argv.includes('--loading-fixture') && request.url === '/api/actions/feed') {
      const payload = JSON.parse(body || '{}')
      if (payload.q === 'client-timeout-fixture') return
      if (payload.q === 'cooldown-fixture' && !_cooldown_fixture_sent) {
        _cooldown_fixture_sent = true
        response.writeHead(429, { 'content-type': 'application/json', 'retry-after': '10' })
          .end(JSON.stringify({ statusCode: 429, data: { retry_after: 10 } }))
        return
      }
      if (payload.q === 'delayed-fixture') await delay(1500)
    }
    const upstream = await fetch(`http://127.0.0.1:${APP_PORT}${request.url}`, {
      method: request.method,
      headers: { 'fly-client-ip': '192.0.2.101', ...(request.headers.cookie ? { cookie: request.headers.cookie } : {}),
        ...(request.headers['content-type'] ? { 'content-type': request.headers['content-type'] } : {}) },
      ...(body !== undefined ? { body } : {}),
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
  REQUESTS.push({ path: url.pathname, raw_url: request.url, query: Object.fromEntries(url.searchParams), tags: url.searchParams.getAll('tags'), languages: url.searchParams.getAll('languages'), exclusions: url.searchParams.getAll('exclude_ids') })
  response.setHeader('content-type', 'application/json')
  if (url.pathname === '/preview/stories' && _fail_feed) {
    response.writeHead(500).end(JSON.stringify({ message: 'Fixture temporary outage.' }))
    return
  }
  if (url.pathname === '/preview/stories' && url.searchParams.get('q') === 'fail-discovery') {
    response.writeHead(500).end(JSON.stringify({ message: 'Fixture discovery failure.' }))
    return
  }
  if (/^\/preview\/stories\/[^/]+$/.test(url.pathname)) {
    const id = url.pathname.split('/').at(-1)
    if (id === 'temporary' && _fail_article) {
      response.writeHead(500).end(JSON.stringify({ message: 'Fixture temporary outage.' }))
      return
    }
    const article = id === 'temporary' ? STORIES[0] : STORIES.find(story => story.id === id)
    if (!article) response.writeHead(id === 'gone' ? 410 : 404).end(JSON.stringify({ message: 'Not found.' }))
    else response.end(JSON.stringify({ data: article }))
    return
  }
  if (url.pathname.startsWith('/sources/')) {
    if (url.pathname.endsWith('source-1')) response.end(JSON.stringify({ data: SOURCE }))
    else response.writeHead(404).end(JSON.stringify({ message: 'Source not found.' }))
    return
  }
  if (url.pathname === '/preview/confidence') {
    response.end(JSON.stringify({ data: url.searchParams.getAll('ids').map(id => ({ id, confidence: 'high' })) }))
    return
  }
  if (url.pathname === '/preview/stories' || url.pathname === '/articles/latest' || /^\/preview\/stories\/[^/]+\/articles?$/.test(url.pathname) || url.pathname === '/preview/stories/story-1/articles' || url.pathname === '/articles/search') {
    const exclusions = new Set(url.searchParams.getAll('exclude_ids'))
    const fixture_articles = url.pathname.endsWith('/articles') && process.env.BEANS_COVERAGE_FIXTURE
      ? ARTICLES.map((article, index) => ({
          ...article,
          published_at: process.env.BEANS_COVERAGE_FIXTURE === 'multi-day' && index === ARTICLES.length - 1
            ? '2026-10-03T12:00:00Z'
            : `2026-10-02T12:${String(index).padStart(2, '0')}:00Z`,
          source: { ...SOURCE, id: `source-${index % 7 + 1}`, site_name: `Fixture publisher ${index % 7 + 1}` }
        }))
      : url.pathname === '/preview/stories' ? STORIES : ARTICLES
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
const app_process = spawn(process.execPath, ['--import', './scripts/fixtures/google-trends-fetch.mjs', '.output/server/index.mjs'], {
  env: {
    ...process.env,
    HOST: '127.0.0.1', PORT: String(APP_PORT), NITRO_HOST: '127.0.0.1', NITRO_PORT: String(APP_PORT),
    NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
    NUXT_CAFECITO_API_KEY: 'fixture-only',
    NUXT_USER_DB: USER_FIXTURE_CONNECTION,
    NUXT_CLERK_SECRET_KEY: 'sk_test_fixture_only',
    NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from('fixture.clerk.accounts.dev$').toString('base64')}`,
    CLERK_KEYLESS_DISABLED: 'true',
    NUXT_RATE_LIMIT_COOKIE_SECRET: RATE_SECRET,
    NUXT_RATE_LIMIT_REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:4930',
    NUXT_RATE_LIMIT_TRUST_FLY: 'true',
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
  app_process.once('exit', () => {
    void rm(USER_FIXTURE_DIR, { recursive: true, force: true })
  })
  mock_server.close()
  browser_server.close()
}
process.once('SIGINT', stopServers)
process.once('SIGTERM', stopServers)

async function fetchPage(path, options) {
  const response = await fetch(`http://127.0.0.1:${APP_PORT}${path}`, { ...options, headers: { ...options?.headers, 'fly-client-ip': '192.0.2.100', 'cookie': [fixtureCookie(), options?.headers?.cookie].filter(Boolean).join('; ') } })
  return { response, html: await response.text() }
}

try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    if (app_process.exitCode !== null) throw new Error(`Production app exited: ${_child_output}`)
    try {
      const { response } = await fetchPage('/about-beans')
      if (response.ok) {
        ready = true
        break
      }
    } catch { /* Wait only until the production listener is available. */ }
    await delay(100)
  }
  assert.ok(ready, 'Production server became available')

  const temporary = await fetchPage('/stories/temporary')
  assert.equal(temporary.response.status, 503)
  assert.equal(temporary.response.headers.get('cache-control'), 'private, no-store')
  assert.match(temporary.html, /Retry/)
  assert.match(temporary.html, /noindex, follow/)
  _fail_feed = false
  _fail_article = false

  const query_home_cookie = `beans_home_discovery=${encodeURIComponent(JSON.stringify({ query: 'old-topic', tags: ['startups'] }))}`
  const publisher_requests_before = REQUESTS.filter(request => /^\/preview\/stories\/[^/]+\/articles$/.test(request.path) || request.path === '/preview/confidence').length
  const query_home = await fetchPage('/?q=search%20query', { headers: { cookie: query_home_cookie } })
  assert.equal(query_home.response.status, 200)
  assert.equal(query_home.response.headers.get('cache-control'), 'private, no-store', 'A home q query is not publicly cached')
  assert.match(query_home.html, /search query/)
  assert.equal((query_home.html.match(/<article(?:\s|>)/g) || []).length, 5)
  assert.equal(REQUESTS.filter(request => /^\/preview\/stories\/[^/]+\/articles$/.test(request.path) || request.path === '/preview/confidence').length, publisher_requests_before, 'Home SSR renders story cards before publisher enrichment')
  const query_home_requests = REQUESTS.filter(request => request.path === '/preview/stories' && request.query.q === 'search query' && request.query.tags === 'startups' && !request.query.categories)
  assert.ok(query_home_requests.some(request => request.query.limit === '5' && !request.query.sort && request.query.score_threshold === DEFAULT_SCORE_THRESHOLD), 'A home q query keeps the five-story request and saved tags')

  const secure_page = await fetchPage('/about-beans', { headers: { 'x-forwarded-proto': 'https' } })
  assert.equal(secure_page.response.headers.get('strict-transport-security'), 'max-age=31536000')
  assert.equal(secure_page.response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(secure_page.response.headers.get('x-frame-options'), 'DENY')
  assert.ok(secure_page.response.headers.get('permissions-policy'))
  assert.ok(secure_page.response.headers.get('referrer-policy'))
  assert.match(secure_page.response.headers.get('content-security-policy'), /frame-ancestors 'none'/)
  assert.equal(secure_page.response.headers.get('cache-control'), 'public, max-age=0, must-revalidate')
  assert.match(secure_page.response.headers.get('etag'), /^W\//)
  const revalidated = await fetchPage('/about-beans', { headers: { 'if-none-match': secure_page.response.headers.get('etag') } })
  assert.ok([200, 304].includes(revalidated.response.status), 'Static About supports public revalidation')

  for (const [path, headline] of [
    ['/', 'Fixture news 1 &amp; coverage'],
    ['/categories/tech-and-innovation', 'Fixture news 1 &amp; coverage'],
    ['/stories/story-1', 'Publisher summary 1.'],
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
    if (path === '/stories/story-1') {
      assert.match(html, /property="og:title" content="Fixture news 1 &(?:amp;)? coverage \| Beans coverage"/)
      assert.match(html, /aria-label="Copy link"/, 'Article detail renders direct sharing actions')
      assert.match(html, /aria-label="LinkedIn"/)
      assert.ok(!html.includes('Original reporting from'), 'Detail omits the visible attribution sentence')
      assert.ok(!html.includes('"citation"'), 'Story metadata does not attribute a story to one publisher')
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

  const request_count = REQUESTS.filter(request => request.path === '/preview/stories').length
  const warm_start = performance.now()
  const warm_home = await fetchPage('/')
  const warm_duration = performance.now() - warm_start
  assert.equal(REQUESTS.filter(request => request.path === '/preview/stories').length, request_count, 'Warm feed uses the bounded presentation cache')
  assert.equal(warm_home.response.headers.get('cache-control'), 'private, no-store')
  const india_home = await fetchPage('/', { headers: { 'accept-language': 'en-IN', 'fly-client-ip': '192.0.2.155' } })
  assert.equal(india_home.response.headers.get('cache-control'), 'private, no-store')
  assert.ok(REQUESTS.some(request => request.path === '/preview/stories' && request.query.tags === 'India News' && !request.query.q))
  const brazil_home = await fetchPage('/', { headers: { 'accept-language': 'pt-BR', 'fly-client-ip': '192.0.2.156' } })
  assert.equal(brazil_home.response.headers.get('cache-control'), 'private, no-store')
  assert.match(brazil_home.html, /GTA 6/)
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
  const home_request = REQUESTS.find(request => request.path === '/preview/stories' && request.query.limit === '5' && !request.query.categories && request.tags[0] === 'GTA 6' && request.tags[1] === 'Space News' && request.tags.length === 2)
  assert.ok(home_request, 'Home requests five stories without categories')
  assert.equal(home_request.query.sort, undefined)
  assert.deepEqual(home_request.exclusions, [])
  assert.equal(home_request.query.score_threshold, undefined)
  assert.equal(home_request.query.q, undefined)
  assert.deepEqual(home_request.tags, ['GTA 6', 'Space News'])
  async function discoveryAction(q) {
    return fetch(`http://127.0.0.1:${APP_PORT}/api/actions/feed`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'fly-client-ip': '192.0.2.100', 'cookie': fixtureCookie() },
      body: JSON.stringify({ home_default: true, q, tags: ['startups'] })
    })
  }
  const discovery_before = REQUESTS.filter(request => request.query.q === 'battery').length
  assert.equal((await discoveryAction('battery')).status, 200)
  assert.equal((await discoveryAction('battery')).status, 200)
  assert.equal(REQUESTS.filter(request => request.query.q === 'battery').length, discovery_before + 1, 'Identical action searches reuse the cached story page')
  const discovery_request = REQUESTS.find(request => request.query.q === 'battery')
  assert.equal(discovery_request.query.score_threshold, DEFAULT_SCORE_THRESHOLD)
  assert.equal(discovery_request.query.categories, undefined)
  const failure_before = REQUESTS.filter(request => request.query.q === 'fail-discovery').length
  const failure = await (await discoveryAction('fail-discovery')).json()
  assert.ok(failure.error_message)
  const failure_after_first = REQUESTS.filter(request => request.query.q === 'fail-discovery').length
  assert.ok(failure_after_first > failure_before, 'A discovery failure reaches the upstream API')
  await discoveryAction('fail-discovery')
  assert.ok(REQUESTS.filter(request => request.query.q === 'fail-discovery').length > failure_after_first, 'Discovery failures are not cached')
  const discovery_cookie = `beans_home_discovery=${encodeURIComponent(JSON.stringify({ query: 'battery', tags: ['startups'] }))}`
  const personalized_before = REQUESTS.filter(request => request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories).length
  const personalized = await fetchPage('/', { headers: { cookie: discovery_cookie } })
  assert.equal(personalized.response.status, 200)
  assert.equal(personalized.response.headers.get('cache-control'), 'private, no-store')
  assert.match(personalized.html, /battery/)
  assert.match(personalized.html, />Find</)
  assert.equal((personalized.html.match(/<article(?:\s|>)/g) || []).length, 5)
  const personalized_requests = REQUESTS.filter(request => request.path === '/preview/stories' && request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories)
  assert.ok(personalized_requests.some(request => request.query.limit === '5' && !request.query.sort && request.query.score_threshold === DEFAULT_SCORE_THRESHOLD), 'A saved home search keeps the five-story request')
  const personalized_after = personalized_requests.length
  assert.equal(personalized_after, personalized_before, 'Saved home search reuses the identical action feed cache')

  const personalized_again = await fetchPage('/', { headers: { cookie: discovery_cookie } })
  assert.equal(personalized_again.response.headers.get('cache-control'), 'private, no-store')
  assert.equal(REQUESTS.filter(request => request.query.q === 'battery' && request.query.tags === 'startups' && !request.query.categories).length, personalized_after, 'Returning home reuses the cached discovery feed')
  const tags_cookie = `beans_home_discovery=${encodeURIComponent(JSON.stringify({ query: '', tags: ['energy'] }))}`
  const tags_home = await fetchPage('/', { headers: { cookie: tags_cookie } })
  assert.equal(tags_home.response.status, 200)
  assert.equal(tags_home.response.headers.get('cache-control'), 'private, no-store')
  const tags_requests = REQUESTS.filter(request => request.path === '/preview/stories' && request.query.tags === 'energy' && !request.query.q && !request.query.categories)
  assert.ok(tags_requests.some(request => request.query.limit === '5' && !request.query.sort && request.query.score_threshold === undefined), 'A tags-only home search loads five stories and omits the score threshold')
  console.log(`Warm home response: ${warm_duration.toFixed(1)} ms; no upstream feed fetches.`)

  for (const [path, expected] of [['/stories/missing', 404], ['/stories/gone', 410], ['/sources/missing', 404]]) {
    assert.equal((await fetchPage(path)).response.status, expected, path)
  }
  assert.equal((await fetchPage('/stories/temporary')).response.status, 200, 'An outage does not permanently mark an article missing')

  assert.equal((await fetchPage('/archive')).response.status, 404, 'Removed archive route is not served')

  const sitemap = await fetchPage('/sitemap.xml')
  assert.equal(sitemap.response.status, 200)
  assert.ok(!sitemap.html.includes('/archive'), 'Removed archive is absent from the sitemap')
  assert.match(sitemap.html, /https:\/\/beans\.cafecito\.tech\/<\/loc>/)
  assert.match(sitemap.html, /\/about-beans<\/loc>/)
  assert.match(sitemap.html, /\/categories\//)
  assert.ok(!sitemap.html.includes('/stories/'), 'Sitemap lists stable routes without story URLs')
  assert.ok(!sitemap.html.includes('/sources/'), 'Sitemap lists stable routes without source URLs')
  assert.ok(!REQUESTS.some(request => request.path === '/preview/articles/unique'), 'Sitemap does not call the removed unique-articles route')
  assert.equal((await fetchPage('/feed.xml')).response.status, 404, 'Removed RSS route is not served')
  assert.match((await fetchPage('/robots.txt')).html, /Sitemap: https:\/\/beans.cafecito.tech\/sitemap.xml/)
  const search_page = await fetchPage('/search?q=sensitive-query')
  assert.match(search_page.html, /content="noindex, follow"/)
  assert.equal(search_page.response.headers.get('cache-control'), 'private, no-store')
  assert.equal(REQUESTS.find(request => request.path === '/articles/search' && request.query.q === 'sensitive-query')?.query.score_threshold, DEFAULT_SCORE_THRESHOLD, 'Search uses the configured score threshold')
  await fetchPage('/search?tags=startups')
  assert.equal(REQUESTS.find(request => request.path === '/articles/search' && request.query.tags === 'startups' && !request.query.q)?.query.score_threshold, undefined, 'Tag-only search omits the score threshold')
  // Node fetch can override Host; use the HTTP client to exercise the actual host middleware.
  const redirect = await new Promise((resolve, reject) => {
    const redirect_request = request(`http://127.0.0.1:${APP_PORT}/stories/story-1?utm_campaign=test`, {
      headers: { host: 'cafecito-beans-app.fly.dev' }
    }, (response) => {
      response.resume()
      response.on('end', () => resolve(response))
    })
    redirect_request.on('error', reject)
    redirect_request.end()
  })
  assert.equal(redirect.statusCode, 308)
  assert.equal(redirect.headers.location, `${SITE_URL}/stories/story-1?utm_campaign=test`)
  const localhost = await fetchPage('/about-beans')
  assert.equal(localhost.response.status, 200, 'Localhost is not redirected')

  async function cursorFeed(payload, locale = 'en-US') {
    const cookie = payload.continuation_token ? CONTINUATION_COOKIES.get(payload.continuation_token) : fixtureCookie()
    const response = await fetch(`http://127.0.0.1:${APP_PORT}/api/actions/feed`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale, 'fly-client-ip': '192.0.2.101', cookie },
      body: JSON.stringify(payload)
    })
    assert.equal(response.status, 200)
    const result = await response.json()
    if (result.continuation_access?.token) CONTINUATION_COOKIES.set(result.continuation_access.token, cookie)
    return result
  }
  const default_home = await cursorFeed({ home_default: true })
  assert.equal(default_home.trend_country, 'US')
  const india_feed = await cursorFeed({ home_default: true }, 'en-IN')
  assert.equal(india_feed.trend_country, 'IN')
  assert.deepEqual(india_feed.default_tags, ['India News'])
  const india_more = await cursorFeed({ home_default: true, trend_country: india_feed.trend_country,
    continuation_token: india_feed.continuation_access.token, default_tags: india_feed.default_tags, from: india_feed.from, cursor: india_feed.cursor }, 'pt-BR')
  assert.equal(india_more.trend_country, 'IN')
  assert.deepEqual(india_more.default_tags, india_feed.default_tags)
  assert.equal(india_more.from, india_feed.from)
  const brazil_feed = await cursorFeed({ home_default: true }, 'pt-BR')
  assert.equal(brazil_feed.trend_country, 'US')
  assert.deepEqual(brazil_feed.default_tags, ['GTA 6', 'Space News'])
  assert.deepEqual(default_home.default_tags, ['GTA 6', 'Space News'])
  assert.equal(default_home.from, new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10))
  assert.ok(REQUESTS.some(request => request.path === '/preview/stories'
    && request.tags[0] === 'GTA 6' && request.tags[1] === 'Space News' && request.tags.length === 2 && !request.query.q
    && request.query.from === default_home.from), 'Home sends original keywords as repeated tags and a three-day window')
  const encoded_home_request = REQUESTS.find(request => request.path === '/preview/stories'
    && request.tags[0] === 'GTA 6' && request.tags[1] === 'Space News')
  assert.match(encoded_home_request?.raw_url ?? '', /[?&]tags=GTA\+6&tags=Space\+News(?:&|$)/, 'Home sends repeated tags through standard $fetch query serialization')
  assert.deepEqual(home_request.languages, NEWS_LANGUAGES, 'English languages are repeated query keys')
  const default_more = await cursorFeed({ home_default: true, continuation_token: default_home.continuation_access.token, default_tags: default_home.default_tags, from: default_home.from, cursor: default_home.cursor })
  assert.deepEqual(default_more.default_tags, default_home.default_tags)
  assert.equal(default_more.from, default_home.from)
  const criteria = { q: 'cursor-fixture', tags: ['startups'], categories: ['artificial_intelligence'] }
  const first_page = await cursorFeed(criteria)
  assert.equal(first_page.articles.length, 5)
  assert.ok(first_page.articles.every(story => !story.other_publishers && !story.confidence), 'Feed action returns stories before enrichment')
  const enriched_response = await fetch(`http://127.0.0.1:${APP_PORT}/api/actions/story_enrichment`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'fly-client-ip': '192.0.2.101', 'cookie': fixtureCookie() },
    body: JSON.stringify({ ids: first_page.articles.map(story => story.id) })
  })
  assert.equal(enriched_response.status, 200)
  const enriched = await enriched_response.json()
  assert.ok(first_page.articles.every(story => enriched[story.id]?.other_publishers?.length && enriched[story.id]?.confidence === 'high'))
  assert.ok(REQUESTS.filter(request => /^\/preview\/stories\/[^/]+\/articles$/.test(request.path)).some(request => request.query.limit === '20'), 'Deferred action uses the existing favicon route')
  const next_page = await cursorFeed({ ...criteria, continuation_token: first_page.continuation_access.token, cursor: first_page.cursor, from: first_page.from, seen_ids: first_page.articles.map(story => story.id) })
  assert.equal(next_page.articles.length, 5)
  assert.ok(next_page.articles.every(story => !first_page.articles.some(previous => previous.id === story.id)))
  const cursor_requests = REQUESTS.filter(request => request.path === '/preview/stories' && request.query.q === criteria.q)
  assert.equal(cursor_requests.length, 2, 'Initial/More each make exactly one collection request')
  assert.equal(cursor_requests[0].query.cursor, undefined)
  assert.equal(cursor_requests[1].query.cursor, first_page.cursor)
  assert.ok(cursor_requests.every(request => request.query.limit === '5' && request.query.tags === 'startups' && request.query.categories === 'artificial_intelligence' && request.query.score_threshold === DEFAULT_SCORE_THRESHOLD && request.query.from === first_page.from))
  assert.ok(REQUESTS.filter(request => request.path === '/preview/stories').every(request => !request.query.sort && !request.exclusions.length && request.query.limit === '5'), 'Every story feed page omits sort/exclusions and requests five')
  console.log('Discovery integration checks passed: SSR content, canonical/meta/JSON-LD, resource errors, removed archive and RSS, static sitemap, host redirects and feed filters.')
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
