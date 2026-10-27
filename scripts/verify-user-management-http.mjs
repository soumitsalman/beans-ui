import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadEnvFile } from 'node:process'
import { generateKeyPairSync, createSign, createHmac, randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { createUserDatabase } from '../server/database/database.ts'
import { migrateUserDatabase } from '../server/database/migrations.ts'
import { signIdentity } from '../server/utils/anonymousIdentity.ts'

const PORT = Number(process.env.TEST_USER_HTTP_PORT || 4930)
const UPSTREAM_PORT = PORT + 1
const ORIGIN = `http://127.0.0.1:${PORT}`
const SECRET = `verification-${randomUUID()}`
const WEBHOOK_SECRET = Buffer.from('beans-user-management-verification').toString('base64')
const directory = await mkdtemp(join(tmpdir(), 'beans-user-http-'))
const connection = `sqlite:${join(directory, 'users.db')}`
const database = createUserDatabase(connection)
await migrateUserDatabase(database)
await database.destroy()
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const FAPI = 'fixture.clerk.accounts.dev'
const publishable_key = `pk_test_${Buffer.from(`${FAPI}$`).toString('base64')}`
function sessionToken(user, expired = false) {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'fixture' })).toString('base64url')
  const claims = Buffer.from(JSON.stringify({ sub: user, sid: `sess_${user}`, iss: `https://${FAPI}`, azp: ORIGIN, iat: now - 120, nbf: now - 120, exp: expired ? now - 60 : now + 3600, v: 2, fva: [0, -1], sts: 'active' })).toString('base64url')
  return `${header}.${claims}.${createSign('RSA-SHA256').update(`${header}.${claims}`).sign(privateKey, 'base64url')}`
}
const REQUESTS = []
let fail_next = false
let slow_next = false
const upstream = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${UPSTREAM_PORT}`)
  REQUESTS.push({ path: url.pathname, query: url.searchParams })
  if (url.pathname === '/preview/stories' && url.searchParams.has('cursor')) {
    if (slow_next) {
      slow_next = false
      await delay(100)
    }
    if (fail_next) {
      fail_next = false
      response.writeHead(503).end('{}')
      return
    }
  }
  response.setHeader('content-type', 'application/json')
  if (url.pathname === '/sources/source-1')
    return response.end(JSON.stringify({ data: { id: 'source-1', site_name: 'Fixture source', url: 'https://example.test' } }))
  if (url.pathname === '/preview/stories/story-1')
    return response.end(JSON.stringify({ data: { id: 'story-1', title: 'Fixture story', last_published_at: new Date().toISOString() } }))
  if (url.pathname === '/preview/confidence')
    return response.end(JSON.stringify({ data: [] }))
  if (url.pathname.endsWith('/articles') && url.searchParams.get('limit') === '20')
    return response.end(JSON.stringify({ data: [] }))
  const offset = Number(url.searchParams.get('cursor') || 0)
  const limit = Number(url.searchParams.get('limit') || 5)
  const data = Array.from({ length: Math.min(limit, Math.max(0, 20 - offset)) }, (_, index) => ({ id: `story-${offset + index + 1}`, title: `Fixture story ${offset + index + 1}`, source: { id: 'source-1', site_name: 'Fixture source' }, last_published_at: new Date().toISOString(), published_at: new Date().toISOString(), categories: ['artificial_intelligence'], tags: [], regions: [], entities: [] }))
  response.end(JSON.stringify({ data, pagination: { next_cursor: offset + limit < 20 ? String(offset + limit) : null } }))
})
await new Promise((resolve, reject) => {
  upstream.once('error', reject)
  upstream.listen(UPSTREAM_PORT, '127.0.0.1', resolve)
})
let browser_proxy
let child_output = ''
const APP_ENV = { ...process.env, HOST: '127.0.0.1', PORT: String(PORT), BEANS_APP_USER_DB: connection, NUXT_USER_DB: '', NUXT_PUBLIC_SITE_URL: ORIGIN,
  NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${UPSTREAM_PORT}`, NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${UPSTREAM_PORT}`,
  NUXT_RATE_LIMIT_COOKIE_SECRET: SECRET, NUXT_RATE_LIMIT_TRUST_FLY: 'true', NUXT_RATE_LIMIT_REDIS_URL: '',
  NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishable_key, NUXT_CLERK_SECRET_KEY: 'sk_test_fixture_only',
  NUXT_CLERK_JWT_KEY: publicKey.export({ type: 'spki', format: 'pem' }), NUXT_CLERK_WEBHOOK_SIGNING_SECRET: `whsec_${WEBHOOK_SECRET}`,
  CLERK_KEYLESS_DISABLED: 'true', NUXT_PUBLIC_GA_MEASUREMENT_ID: '' }
let child = spawn(process.execPath, ['--import', './scripts/fixtures/google-trends-fetch.mjs', '.output/server/index.mjs'], {
  env: APP_ENV, stdio: ['ignore', 'pipe', 'pipe']
})
child.stdout.on('data', (value) => {
  child_output += value
})
child.stderr.on('data', (value) => {
  child_output += value
})
let sequence = 1
const cookie = () => `beans_anonymous_id=${signIdentity(randomUUID(), Date.now(), SECRET)}`
async function call(path, { method = 'GET', body, token, cookies = cookie(), origin = ORIGIN, headers = {} } = {}) {
  const response = await fetch(`${ORIGIN}${path}`, { method, redirect: 'manual', headers: { 'cookie': cookies, 'fly-client-ip': `192.0.2.${sequence++ % 200 + 1}`, origin, ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) })
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { response, data }
}
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error('Fixture app exited before startup.')
    try {
      await fetch(`${ORIGIN}/robots.txt`)
      break
    } catch {
      await delay(100)
    }
  }
  const visitor = await call('/api/account/session')
  assert.equal(visitor.data.signed_in, false)
  const alice = sessionToken('user_alice')
  const bob = sessionToken('user_bob')
  const verified = await call('/api/account/session', { token: alice })
  assert.equal(verified.data.signed_in, true, JSON.stringify(verified.data))
  assert.equal(verified.response.headers.get('cache-control'), 'private, no-store')
  const preference = { topic: 'private preference marker', tags: ['ai_policy'], domains: ['bbc'], exclude_domains: ['example'], languages: ['en-us'] }
  assert.equal((await call('/api/account/preferences', { method: 'POST', body: { preference, version: 0 } })).response.status, 401)
  assert.equal((await call('/api/account/preferences', { method: 'POST', token: alice, origin: 'https://evil.test', body: { preference, version: 0 } })).response.status, 403)
  assert.equal((await call('/api/account/preferences', { method: 'POST', token: alice })).response.status, 400)
  const saved = await call('/api/account/preferences', { method: 'POST', token: alice, body: { preference, version: 0 } })
  assert.equal(saved.response.status, 200, JSON.stringify(saved.data))
  assert.equal((await call('/api/account/preferences', { token: bob })).data.preference, null)
  assert.equal((await call('/api/account/preferences', { method: 'POST', token: alice, body: { preference, version: 0 } })).response.status, 409)
  assert.equal((await call('/api/account/preferences', { method: 'POST', token: alice, body: { preference: { ...preference, languages: ['es'] }, version: 1 } })).response.status, 400)
  const personalized = await call('/api/actions/feed', { method: 'POST', token: alice, body: { home_default: true } })
  assert.equal(personalized.data.personalized, true)
  const query = REQUESTS.filter(request => request.path === '/preview/stories').at(-1).query
  assert.deepEqual(query.getAll('domains'), ['bbc'])
  assert.deepEqual(query.getAll('exclude_domains'), ['example'])
  assert.deepEqual(query.getAll('languages'), ['en-us'])
  assert.equal(query.get('q'), preference.topic)
  const private_before = REQUESTS.filter(request => request.path === '/preview/stories' && request.query.get('q') === preference.topic).length
  await call('/api/actions/feed', { method: 'POST', token: alice, body: { home_default: true } })
  assert.equal(REQUESTS.filter(request => request.path === '/preview/stories' && request.query.get('q') === preference.topic).length, private_before + 1, 'Personalized collection requests bypass shared cache')
  const private_about = await call('/about-beans', { token: alice, headers: { accept: 'text/html' } })
  assert.equal(private_about.response.headers.get('cache-control'), 'private, no-store')
  assert.equal(private_about.response.headers.has('etag'), false)
  const temporary = await call('/api/actions/feed', { method: 'POST', token: alice, body: { home_default: true, q: 'temporary' } })
  assert.equal(temporary.data.personalized, false)
  assert.equal((await call('/api/account/preferences', { token: alice })).data.preference.topic, preference.topic)
  const html = await call('/', { token: alice, headers: { accept: 'text/html' } })
  assert.equal(html.response.status, 200)
  assert.match(html.data, /Fixture story 1/)
  assert.match(html.data, />More</, 'SSR must render the continuation control')
  assert.equal(html.response.headers.get('cache-control'), 'private, no-store')
  const public_html = await call('/', { headers: { accept: 'text/html' } })
  assert.doesNotMatch(public_html.data, /private preference marker/)
  const contexts = [
    ['feed', { home_default: true }], ['feed', { categories: ['artificial_intelligence'] }],
    ['feed', { source_id: 'source-1' }], ['search', { q: 'fixture', domains: ['bbc'] }], ['related', { id: 'story-1' }]
  ]
  for (const [action, input] of contexts) {
    const cookies = cookie()
    const initial = await call(`/api/actions/${action}`, { method: 'POST', cookies, body: input })
    assert.equal(initial.response.status, 200, `${action}: ${JSON.stringify(initial.data)}`)
    const access = initial.data.continuation_access
    assert.equal(access.state, 'available')
    const cursor = action === 'feed' ? input.source_id ? initial.data.source_cursor : initial.data.cursor : initial.data.next_cursor
    const continuation = { ...input, ...(input.source_id ? { source_cursor: cursor } : { cursor }), continuation_token: access.token }
    const first = await call(`/api/actions/${action}`, { method: 'POST', cookies, body: continuation })
    assert.equal(first.response.status, 200, JSON.stringify(first.data))
    assert.equal(first.data.continuation_access.state, 'sign_in_required')
    const upstream_count = REQUESTS.length
    const replay = await call(`/api/actions/${action}`, { method: 'POST', cookies, body: continuation })
    assert.equal(replay.response.status, 403)
    assert.equal(REQUESTS.length, upstream_count)
    const reopen = await call(`/api/actions/${action}`, { method: 'POST', cookies, body: input })
    assert.equal(reopen.data.continuation_access.state, 'sign_in_required')
    if (action === 'feed') {
      const alternate = input.categories ? { categories: [' artificial_intelligence ,ARTIFICIAL_INTELLIGENCE'] } : input.home_default ? { home_default: false, categories: [' ', ''] } : input
      const equivalent = await call('/api/actions/feed', { method: 'POST', cookies, body: alternate })
      assert.equal(equivalent.data.continuation_access.state, 'sign_in_required', 'Equivalent page definitions cannot reset the allowance')
    }
    if (action === 'search') {
      const equivalent = await call('/api/actions/search', { method: 'POST', cookies, body: { q: ' FIXTURE ', domains: [' BBC, bbc '] } })
      assert.equal(equivalent.data.continuation_access.state, 'sign_in_required')
    }
    const authenticated = await call(`/api/actions/${action}`, { method: 'POST', cookies, token: bob, body: continuation })
    assert.equal(authenticated.response.status, 200)
    assert.equal(authenticated.data.continuation_access.state, 'authenticated_available')
  }
  const retry_cookie = cookie()
  const retry_input = { home_default: true, q: `retry-${randomUUID()}` }
  const retry_initial = await call('/api/actions/feed', { method: 'POST', cookies: retry_cookie, body: retry_input })
  const retry_body = { ...retry_input, cursor: retry_initial.data.cursor, continuation_token: retry_initial.data.continuation_access.token }
  fail_next = true
  const failed = await call('/api/actions/feed', { method: 'POST', cookies: retry_cookie, body: retry_body })
  assert.ok(failed.data.error_message)
  const retried = await call('/api/actions/feed', { method: 'POST', cookies: retry_cookie, body: retry_body })
  assert.equal(retried.data.error_message, null)
  assert.equal(retried.data.continuation_access.state, 'sign_in_required')
  const race_cookie = cookie()
  const race_input = { home_default: true, q: `race-${randomUUID()}` }
  const race_initial = await call('/api/actions/feed', { method: 'POST', cookies: race_cookie, body: race_input })
  const race_body = { ...race_input, cursor: race_initial.data.cursor, continuation_token: race_initial.data.continuation_access.token }
  slow_next = true
  const race = await Promise.all(Array.from({ length: 4 }, () => call('/api/actions/feed', { method: 'POST', cookies: race_cookie, body: race_body })))
  assert.equal(race.filter(result => result.response.status === 200 && !result.data.error_message).length, 1)
  assert.equal((await call('/api/account/session', { token: sessionToken('user_expired', true) })).data.signed_in, false)
  const clear = await call('/api/account/preferences', { method: 'DELETE', token: alice, body: { version: 1 } })
  assert.equal(clear.response.status, 200)
  assert.equal((await call('/api/actions/feed', { method: 'POST', token: alice, body: { home_default: true } })).data.personalized, false)
  await call('/api/account/preferences', { method: 'POST', token: alice, body: { preference, version: 0 } })
  const timestamp = String(Math.floor(Date.now() / 1000))
  const webhook_id = 'msg_fixture_delete'
  const webhook_body = JSON.stringify({ object: 'event', type: 'user.deleted', data: { id: 'user_alice', object: 'user', deleted: true }, timestamp: Date.now() })
  assert.equal((await call('/api/webhooks/clerk', { method: 'POST', body: webhook_body })).response.status, 400)
  const signature = createHmac('sha256', Buffer.from(WEBHOOK_SECRET, 'base64')).update(`${webhook_id}.${timestamp}.${webhook_body}`).digest('base64')
  for (let delivery = 0; delivery < 2; delivery++)
    assert.equal((await call('/api/webhooks/clerk', { method: 'POST', body: webhook_body, headers: { 'svix-id': webhook_id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` } })).response.status, 200)
  assert.equal((await call('/api/account/preferences', { token: alice })).data.preference, null)
  assert.doesNotMatch(child_output, /private preference marker|sk_test_fixture_only|Bearer ey/)
  console.info('Production HTTP checks passed: verified Clerk JWTs, ownership, validation/conflicts, Home filters/precedence, private SSR, five-surface visitor enforcement, reopening, authenticated continuation, concurrent requests/failure retries, expired sessions, verified deletion webhook and duplicate delivery.')
  if (!process.argv.includes('--serve') && !process.argv.includes('--serve-auth')) {
    child.kill('SIGTERM')
    await new Promise(resolve => child.once('exit', resolve))
    child = spawn(process.execPath, ['--import', './scripts/fixtures/google-trends-fetch.mjs', '.output/server/index.mjs'], {
      env: { ...APP_ENV, BEANS_APP_USER_DB: 'unavailable:' }, stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.on('data', (value) => {
      child_output += value
    })
    child.stderr.on('data', (value) => {
      child_output += value
    })
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        await fetch(`${ORIGIN}/robots.txt`)
        break
      } catch {
        await delay(100)
      }
    }
    const unavailable_session = await call('/api/account/session', { token: bob })
    assert.equal(unavailable_session.data.signed_in, true)
    assert.ok(unavailable_session.data.error_message)
    const public_fallback = await call('/api/actions/feed', { method: 'POST', token: bob, body: { home_default: true } })
    assert.equal(public_fallback.response.status, 200)
    assert.equal(public_fallback.data.articles.length, 5)
    assert.equal(public_fallback.data.personalized, false)
    assert.match(public_fallback.data.error_message, /Preferences could not be loaded/)
    assert.equal((await call('/api/account/preferences', { method: 'POST', token: bob, body: { preference, version: 0 } })).response.status, 503)
    console.info('Storage-outage HTTP checks passed: public news stays readable, unavailable preference state is explicit, and protected writes fail closed.')
  }
  if (process.argv.includes('--serve-auth')) {
    let signed_in = true
    let fail_next_save = false
    const ui_token = sessionToken('user_browser_fixture')
    browser_proxy = createServer(async (request, response) => {
      if (request.url === '/__fixture/fail-next-save') {
        fail_next_save = true
        response.end('The next preference save will fail in this isolated fixture.')
        return
      }
      if (fail_next_save && request.url === '/api/account/preferences' && request.method === 'POST') {
        fail_next_save = false
        response.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ statusCode: 503, statusMessage: 'Preferences were not saved. Your previous preference remains active. Please retry.' }))
        return
      }
      if (request.url === '/__fixture/visitor' || request.url === '/__fixture/authenticated') {
        signed_in = request.url === '/__fixture/authenticated'
        response.writeHead(302, { location: '/' }).end()
        return
      }
      try {
        const chunks = []
        for await (const chunk of request) chunks.push(chunk)
        const body = Buffer.concat(chunks)
        const result = await fetch(`${ORIGIN}${request.url}`, { method: request.method, redirect: 'manual', headers: {
          ...request.headers, 'host': `127.0.0.1:${PORT}`, 'origin': ORIGIN,
          'fly-client-ip': '192.0.2.222', ...(signed_in ? { authorization: `Bearer ${ui_token}` } : {})
        }, ...(body.length ? { body } : {}) })
        const headers = Object.fromEntries(result.headers)
        delete headers['content-length']
        delete headers['content-encoding']
        if (result.headers.getSetCookie().length) headers['set-cookie'] = result.headers.getSetCookie()
        response.writeHead(result.status, headers)
        response.end(Buffer.from(await result.arrayBuffer()))
      } catch {
        response.writeHead(502).end('Fixture proxy unavailable.')
      }
    })
    await new Promise((resolve, reject) => {
      browser_proxy.once('error', reject)
      browser_proxy.listen(PORT + 2, '127.0.0.1', resolve)
    })
    console.info(`Isolated authenticated UI fixture at http://127.0.0.1:${PORT + 2}; Clerk client intentionally unavailable; server sessions are locally verified test JWTs.`)
    await new Promise(resolve => process.once('SIGTERM', resolve))
  }
  if (process.argv.includes('--serve')) {
    child.kill('SIGTERM')
    await new Promise(resolve => child.once('exit', resolve))
    loadEnvFile()
    child = spawn(process.execPath, ['--import', './scripts/fixtures/google-trends-fetch.mjs', '.output/server/index.mjs'], {
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(PORT), NUXT_USER_DB: connection, NUXT_PUBLIC_SITE_URL: ORIGIN,
        NUXT_BEANS_API_BASE_URL: `http://127.0.0.1:${UPSTREAM_PORT}`, NUXT_ESPRESSO_API_BASE_URL: `http://127.0.0.1:${UPSTREAM_PORT}`,
        NUXT_RATE_LIMIT_COOKIE_SECRET: SECRET, NUXT_RATE_LIMIT_TRUST_FLY: 'false', NUXT_RATE_LIMIT_REDIS_URL: '',
        NUXT_CLERK_JWT_KEY: process.env.NUXT_CLERK_JWT_KEY || '', CLERK_KEYLESS_DISABLED: 'true', NUXT_PUBLIC_GA_MEASUREMENT_ID: '' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.on('data', (value) => {
      child_output += value
    })
    child.stderr.on('data', (value) => {
      child_output += value
    })
    console.info(`Visitor browser fixture with configured development Clerk available at ${ORIGIN}`)
    await new Promise(resolve => process.once('SIGTERM', resolve))
  }
} catch (error) {
  console.error(error)
  console.error(child_output.split('\n').filter(line => /error|failed|ERROR|Error/.test(line)).slice(-12).join('\n'))
  process.exitCode = 1
} finally {
  child.kill('SIGTERM')
  await new Promise((resolve) => {
    if (child.exitCode !== null)
      resolve()
    else
      child.once('exit', resolve)
  })
  if (browser_proxy) await new Promise(resolve => browser_proxy.close(resolve))
  await new Promise(resolve => upstream.close(resolve))
  await rm(directory, { recursive: true, force: true })
}
