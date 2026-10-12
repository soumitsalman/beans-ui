import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { Redis } from 'ioredis'
import { signIdentity, verifyIdentity, normaliseIp, hashIdentity, COOKIE_LIFETIME_SECONDS } from '../server/utils/anonymousIdentity.ts'
import { consumeQuota, disconnectRateLimitStore, RATE_LIMIT_SCRIPT, WINDOW_MS } from '../server/utils/rateLimitStore.ts'

const SECRET = `rate-limit-fixture:${randomUUID()}`
const REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:4930'
const REDIS = new Redis(REDIS_URL)
const PREFIX = `beans-test:{${randomUUID()}}`
const APP_PORT = 4931
const SECOND_PORT = 4933
const MOCK_PORT = 4932
const CHILDREN = []
let _upstream_calls = 0
let _child_output = ''

const id = randomUUID()
const signed = signIdentity(id, Date.now(), SECRET)
assert.equal(verifyIdentity(signed, SECRET), id)
assert.equal(verifyIdentity(`${signed}x`, SECRET), null)
assert.equal(verifyIdentity(signed, 'wrong-secret'), null)
assert.equal(verifyIdentity(signIdentity(id, Date.now() - COOKIE_LIFETIME_SECONDS * 1000, SECRET), SECRET), null)
assert.equal(verifyIdentity(signIdentity(id, Date.now() + 5000, SECRET), SECRET), null)
assert.equal(normaliseIp('2001:0db8:0:0::1'), '2001:db8::1')
assert.equal(normaliseIp('::ffff:192.0.2.1'), '192.0.2.1')
assert.equal(normaliseIp('192.0.2.1, 198.51.100.1'), null)

const ARTICLE = { id: 'article-1', title: 'Fixture article', story_id: 'story-1', source: { id: 'source-1' } }
const MOCK = createServer((request, response) => {
  _upstream_calls++
  const url = new URL(request.url, 'http://fixture')
  response.setHeader('content-type', 'application/json')
  if (url.pathname === '/preview/stories/article-1') response.end(JSON.stringify({ data: ARTICLE }))
  else if (url.pathname === '/sources/source-1') response.end(JSON.stringify({ data: { id: 'source-1', site_name: 'Fixture publisher' } }))
  else if (url.pathname === '/preview/confidence') response.end(JSON.stringify({ data: [{ id: 'article-1', confidence: 'high' }] }))
  else response.end(JSON.stringify({ data: [ARTICLE], pagination: { next_cursor: null } }))
})

function startApp(port, overrides = {}) {
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
      NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`, NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      NUXT_CAFECITO_API_KEY: 'fixture-only', NUXT_RATE_LIMIT_COOKIE_SECRET: SECRET, NUXT_RATE_LIMIT_REDIS_URL: REDIS_URL,
      NUXT_RATE_LIMIT_TRUST_FLY: 'true', ...overrides },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  CHILDREN.push(child)
  child.stdout.on('data', (chunk) => {
    _child_output += chunk
  })
  child.stderr.on('data', (chunk) => {
    _child_output += chunk
  })
  return child
}
async function ready(port) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/robots.txt`)).ok) return
    } catch { /* Starting. */ }
    await delay(100)
  }
  throw new Error(`App did not start: ${_child_output.slice(-2000)}`)
}
function cookieFor(id = randomUUID()) {
  return `beans_anonymous_id=${signIdentity(id, Date.now(), SECRET)}`
}
async function action(cookie, ip = '192.0.2.1', action_name = 'feed', payload = {}, port = APP_PORT) {
  return fetch(`http://127.0.0.1:${port}/api/actions/${action_name}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'fly-client-ip': ip, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(payload)
  })
}

try {
  // Exercise the actual atomic script with simultaneous requests, boundary expiration and TTL.
  const keys = [`${PREFIX}:browser`, `${PREFIX}:ip`]
  const concurrent = await Promise.all(Array.from({ length: 30 }, () => consumeQuota(keys, [10, 60], REDIS_URL)))
  assert.equal(concurrent.filter(result => result.allowed).length, 10)
  assert.ok(concurrent.filter(result => !result.allowed).every(result => result.retry_after >= 1 && result.retry_after <= 60))
  assert.ok(await REDIS.pttl(keys[0]) > 0)
  const time = await REDIS.time()
  const now = Number(time[0]) * 1000 + Math.floor(Number(time[1]) / 1000)
  const expiry_key = `${PREFIX}:expiry`
  await REDIS.zadd(expiry_key, now - WINDOW_MS, 'expired', now - WINDOW_MS + 5000, 'active')
  const result = await REDIS.eval(RATE_LIMIT_SCRIPT, 1, expiry_key, WINDOW_MS, randomUUID(), 2)
  assert.equal(result[0], 1)
  assert.equal(await REDIS.zscore(expiry_key, 'expired'), null)
  assert.notEqual(await REDIS.zscore(expiry_key, 'active'), null)

  await new Promise(resolve => MOCK.listen(MOCK_PORT, '127.0.0.1', resolve))
  startApp(APP_PORT)
  startApp(SECOND_PORT)
  await Promise.all([ready(APP_PORT), ready(SECOND_PORT)])
  const first = await action(undefined, '192.0.2.2', 'feed')
  assert.equal(first.status, 200)
  const set_cookie = first.headers.get('set-cookie')
  assert.match(set_cookie, /HttpOnly/)
  assert.match(set_cookie, /Secure/)
  assert.match(set_cookie, /SameSite=Lax/)
  assert.match(set_cookie, /Max-Age=2592000/)
  const cookie = set_cookie.split(';')[0]
  assert.equal(first.headers.get('x-ratelimit-remaining'), '9')
  for (let count = 0; count < 9; count++) assert.equal((await action(cookie, '192.0.2.3', 'feed', {}, count % 2 ? APP_PORT : SECOND_PORT)).status, 200)
  const before_rejected = _upstream_calls
  const denied = await action(cookie, '192.0.2.4', 'story', { id: 'article-1' })
  assert.equal(denied.status, 429, 'Cookie quota persists across IPs and Machines')
  assert.ok(Number(denied.headers.get('retry-after')) >= 1)
  assert.equal(_upstream_calls, before_rejected, 'Rejected action performs no upstream work')
  assert.equal(denied.headers.get('cache-control'), 'private, no-store')

  const doc_cookie = cookieFor()
  const document = await fetch(`http://127.0.0.1:${APP_PORT}/stories/article-1`, { headers: { 'cookie': doc_cookie, 'fly-client-ip': '192.0.2.5' } })
  assert.equal(document.status, 200)
  assert.match(await document.text(), /Fixture article/)
  assert.equal(document.headers.get('x-ratelimit-remaining'), '9', 'SSR snapshot/coverage/related count only once')
  assert.equal(document.headers.get('cache-control'), 'private, no-store')
  for (let count = 0; count < 9; count++) assert.equal((await action(doc_cookie, '192.0.2.5')).status, 200)
  const blocked_doc = await fetch(`http://127.0.0.1:${APP_PORT}/`, { headers: { 'cookie': doc_cookie, 'fly-client-ip': '192.0.2.5' } })
  assert.equal(blocked_doc.status, 429)
  assert.match(await blocked_doc.text(), /Too many requests/)

  for (let count = 0; count < 10; count++) {
    const response = await action(count % 2 ? 'beans_anonymous_id=forged' : undefined, '192.0.2.6')
    assert.equal(response.status, 200, `Cookie reset attempt ${count + 1}: ${await response.text()}`)
  }
  const reset_denied = await action(undefined, '192.0.2.6')
  assert.equal(reset_denied.status, 429, 'Discarding/forging cookies cannot reset the fallback quota')
  assert.equal(reset_denied.headers.get('set-cookie'), null, 'Rejected resets cannot obtain an uncharged signed identity')
  const reset_cookie = cookieFor()
  const browser_key = `beans:{actions}:browser:${hashIdentity(reset_cookie.split('=')[1].split('.')[0], SECRET)}`
  for (let count = 0; count < 10; count++) await action(reset_cookie, '192.0.2.7')
  await REDIS.zadd(browser_key, Date.now() - WINDOW_MS - 10, 'expired')
  const entries = await REDIS.zrange(browser_key, 0, -1)
  for (const entry of entries) await REDIS.zadd(browser_key, Date.now() - WINDOW_MS - 10, entry)
  assert.equal((await action(reset_cookie, '192.0.2.7')).status, 200, 'Expired window permits the next action')

  // Many independently valid browser cookies still share the generous IP ceiling.
  for (let count = 0; count < 60; count++) assert.equal((await action(cookieFor(), '192.0.2.8')).status, 200)
  assert.equal((await action(cookieFor(), '192.0.2.8')).status, 429)
  const head = await fetch(`http://127.0.0.1:${APP_PORT}/about-beans`, { method: 'HEAD', headers: { 'fly-client-ip': '192.0.2.11', 'cookie': cookieFor() } })
  assert.equal(head.status, 200)
  assert.equal(head.headers.get('x-ratelimit-limit'), null)
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}/about-beans/`, { headers: { 'fly-client-ip': '192.0.2.11', 'cookie': cookieFor() } })).status, 200)
  const before_bypass = _upstream_calls
  for (const path of ['/api/beans/preview/articles/unique', '/api/espresso/preview/confidence']) {
    assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}${path}`)).status, 404)
  }
  assert.equal(_upstream_calls, before_bypass)
  assert.equal((await action(cookieFor(), '192.0.2.9', 'feed', { arbitrary_path: '/preview/secrets' })).status, 400)
  assert.equal((await action(cookieFor(), '192.0.2.9', 'story', { id: '../secret' })).status, 400)
  assert.equal((await action(cookieFor(), '192.0.2.9', 'feed', { limit: 10000 })).status, 400)
  assert.equal((await action(cookieFor(), '192.0.2.9', 'feed', { q: 'x'.repeat(100_001) })).status, 413)
  assert.equal((await action(cookieFor(), '192.0.2.9', 'feed', null)).status, 400)
  assert.equal((await fetch(`http://127.0.0.1:${APP_PORT}/api/actions/page`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' }, body: '{}' })).status, 503, 'Untrusted forwarding headers do not supply a Fly identity')
  const excluded = await fetch(`http://127.0.0.1:${APP_PORT}/robots.txt`, { headers: { cookie, 'fly-client-ip': '192.0.2.4' } })
  assert.equal(excluded.status, 200)
  assert.equal(excluded.headers.get('x-ratelimit-limit'), null)

  const fail_child = startApp(4934, { NUXT_RATE_LIMIT_REDIS_URL: 'redis://127.0.0.1:4999' })
  await ready(4934)
  const before_outage = _upstream_calls
  assert.equal((await action(cookieFor(), '192.0.2.10', 'story', { id: 'article-1' }, 4934)).status, 503)
  assert.equal(_upstream_calls, before_outage)
  fail_child.kill('SIGTERM')
  console.log('Rate-limit checks passed: signed cookies, IP validation, atomic rolling windows, concurrent/shared quotas, SSR single charging, reset resistance, bypass blocking, and Redis outage protection.')
} finally {
  for (const child of CHILDREN) child.kill('SIGTERM')
  MOCK.close()
  const test_keys = await REDIS.keys(`${PREFIX}:*`)
  if (test_keys.length) await REDIS.del(...test_keys)
  // Only this fixture owns the dedicated Redis database on port 4930.
  if (REDIS_URL === 'redis://127.0.0.1:4930') await REDIS.flushdb()
  disconnectRateLimitStore()
  await REDIS.quit()
}
