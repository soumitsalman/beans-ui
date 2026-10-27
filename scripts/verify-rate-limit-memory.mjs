import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { UPSTREAM_TIMEOUT_MS } from '../shared/actionTiming.ts'
import { consumeQuota, WINDOW_MS } from '../server/utils/rateLimitStore.ts'
import { signIdentity } from '../server/utils/anonymousIdentity.ts'

const PREFIX = `memory-fixture:${randomUUID()}`
const SECRET = `memory-cookie-secret:${randomUUID()}`
const FIRST_PORT = 4941
const SECOND_PORT = 4942
const MOCK_PORT = 4940
const CHILDREN = []
let _upstream_calls = 0
let _child_output = ''
let _stalled_closed = false

// No Redis connection is needed, even outside a Nuxt development build.
const results = await Promise.all(Array.from({ length: 30 }, (_, index) => consumeQuota(
  [`${PREFIX}:browser`, `${PREFIX}:ip`], [10, 60], index % 2 ? '' : '   '
)))
assert.equal(results.filter(result => result.allowed).length, 10)
assert.ok(results.filter(result => !result.allowed).every(result => result.remaining === 0 && result.retry_after > 0))

const ORIGINAL_NOW = Date.now
let _now = ORIGINAL_NOW()
try {
  Date.now = () => _now
  const key = `${PREFIX}:expiry`
  assert.equal((await consumeQuota([key], [1], '')).allowed, true)
  _now += WINDOW_MS - 1
  assert.equal((await consumeQuota([key], [1], '')).retry_after, 1)
  _now += 1
  assert.equal((await consumeQuota([key], [1], '')).allowed, true, 'The exact rolling-window boundary expires')
  const blocked_ip = `${PREFIX}:blocked-ip`
  await consumeQuota([blocked_ip], [1], '')
  assert.equal((await consumeQuota([`${PREFIX}:uncharged-browser`, blocked_ip], [1, 1], '')).allowed, false)
  assert.equal((await consumeQuota([`${PREFIX}:uncharged-browser`], [1], '')).allowed, true, 'IP rejection consumes no browser quota')
} finally {
  Date.now = ORIGINAL_NOW
}

const MOCK = createServer((request, response) => {
  _upstream_calls++
  if (request.url.startsWith('/preview/stories/stalled')) {
    response.once('close', () => {
      _stalled_closed = true
    })
    return
  }
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ data: { id: 'article-1', title: 'Memory fixture article' } }))
})

function startApp(port) {
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
      NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
      NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      NUXT_CAFECITO_API_KEY: 'fixture-only', NUXT_RATE_LIMIT_COOKIE_SECRET: SECRET,
      NUXT_RATE_LIMIT_REDIS_URL: '', NUXT_RATE_LIMIT_TRUST_FLY: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  CHILDREN.push(child)
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
    _child_output += chunk
  })
}

async function ready(port) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/robots.txt`)).ok) return
    } catch { /* Wait for the production listener. */ }
    await delay(100)
  }
  throw new Error(`Production app did not start: ${_child_output.slice(-2000)}`)
}

function cookieFor() {
  return `beans_anonymous_id=${signIdentity(randomUUID(), Date.now(), SECRET)}`
}

function action(cookie, ip = '192.0.2.1', port = FIRST_PORT, name = 'feed', payload = { categories: ['artificial_intelligence'] }) {
  return fetch(`http://127.0.0.1:${port}/api/actions/${name}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'fly-client-ip': ip, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(payload)
  })
}

try {
  await new Promise(resolve => MOCK.listen(MOCK_PORT, '127.0.0.1', resolve))
  startApp(FIRST_PORT)
  startApp(SECOND_PORT)
  await Promise.all([ready(FIRST_PORT), ready(SECOND_PORT)])
  const document = await fetch(`http://127.0.0.1:${FIRST_PORT}/stories/article-1`, { headers: { 'fly-client-ip': '192.0.2.1' } })
  assert.equal(document.status, 200, 'Production renders content without a Redis URL')
  assert.match(await document.text(), /Memory fixture article/)
  assert.equal(document.headers.get('x-ratelimit-remaining'), '9')
  assert.equal(document.headers.get('cache-control'), 'private, no-store')
  const cookie = document.headers.get('set-cookie').split(';')[0]
  for (let index = 0; index < 9; index++) assert.equal((await action(cookie)).status, 200)
  const before_denied = _upstream_calls
  for (const path of ['/about-beans', '/about-beans/', '/search', '/methodology']) {
    const response = await fetch(`http://127.0.0.1:${FIRST_PORT}${path}`, { headers: { cookie, 'fly-client-ip': '192.0.2.1' }, redirect: 'manual' })
    assert.ok([200, 301].includes(response.status), 'Static navigation works after quota exhaustion')
    assert.equal(response.headers.get('x-ratelimit-limit'), null, 'Static pages spend no action quota')
  }
  const denied = await action(cookie, '192.0.2.2', FIRST_PORT, 'story', { id: 'article-1' })
  assert.equal(denied.status, 429)
  assert.ok(Number(denied.headers.get('retry-after')) >= 1)
  assert.equal(_upstream_calls, before_denied, 'Memory rejection happens before upstream work')
  assert.equal((await action(cookie, '192.0.2.2', SECOND_PORT)).status, 200, 'Each production process has its own quota')
  const concurrent_cookie = cookieFor()
  const concurrent = await Promise.all(Array.from({ length: 30 }, () => action(concurrent_cookie, '192.0.2.3')))
  assert.equal(concurrent.filter(response => response.status === 200).length, 10)
  assert.equal(concurrent.filter(response => response.status === 429).length, 20)
  for (let index = 0; index < 10; index++) assert.equal((await action(undefined, '192.0.2.4')).status, 200)
  const reset_denied = await action(undefined, '192.0.2.4')
  assert.equal(reset_denied.status, 429)
  assert.equal(reset_denied.headers.get('set-cookie'), null)
  for (let index = 0; index < 60; index++) assert.equal((await action(cookieFor(), '192.0.2.5')).status, 200)
  assert.equal((await action(cookieFor(), '192.0.2.5')).status, 429)
  const stalled_at = Date.now()
  const stalled = await action(cookieFor(), '192.0.2.6', FIRST_PORT, 'story', { id: 'stalled' })
  assert.equal(stalled.status, 503, 'A stalled upstream returns a retryable response')
  assert.equal(stalled.headers.get('retry-after'), '5')
  assert.ok(Date.now() - stalled_at >= UPSTREAM_TIMEOUT_MS - 1000 && Date.now() - stalled_at < UPSTREAM_TIMEOUT_MS + 5000, 'Upstream timeout bounds real HTTP actions')
  await delay(100)
  assert.equal(_stalled_closed, true, 'The stalled upstream connection is aborted')
  console.log('Memory rate-limit checks passed: production SSR without Redis, independent processes, concurrency, rolling expiry, IP guards, and rejection before upstream work.')
} finally {
  for (const child of CHILDREN) child.kill('SIGTERM')
  MOCK.close()
}
