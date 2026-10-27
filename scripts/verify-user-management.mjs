import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { z } from 'zod'
import pg from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { createUserDatabase } from '../server/database/database.ts'
import { migrateUserDatabase } from '../server/database/migrations.ts'
import { createPreferenceRepository } from '../server/database/repository.ts'
import { createContinuationRepository } from '../server/database/continuationRepository.ts'
import { NEWS_LANGUAGES } from '../shared/news.ts'

async function loadModule(path, bindings, names) {
  const source = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8')).replace(/^import .*\n/gm, '').replace(/^export /gm, '')
  return new Function(...Object.keys(bindings), `${source}\nreturn { ${names.join(', ')} };`)(...Object.values(bindings))
}
const { PREFERENCE_SCHEMA, normalisePreferences, EMPTY_PREFERENCE } = await loadModule('../shared/userPreferences.ts', { z, NEWS_LANGUAGES }, ['PREFERENCE_SCHEMA', 'normalisePreferences', 'EMPTY_PREFERENCE'])
const { ACTION_INPUTS } = await loadModule('../server/utils/actionInput.ts', { z }, ['ACTION_INPUTS'])
assert.equal(ACTION_INPUTS.related.parse({ id: 'ABCDEF01-1234-5678-ABCD-ABCDEF012345' }).id, 'abcdef01-1234-5678-abcd-abcdef012345')
assert.equal(ACTION_INPUTS.related.parse({ id: 'OpaqueCaseSensitive' }).id, 'OpaqueCaseSensitive')
const { safeReturnPath } = await loadModule('../shared/account.ts', {}, ['safeReturnPath'])
for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', '/\nLocation: evil'])
  assert.equal(safeReturnPath(bad), '/')
assert.equal(safeReturnPath('/search?q=chips&tags=ai#results'), '/search?q=chips&tags=ai#results')
assert.equal(PREFERENCE_SCHEMA.safeParse(normalisePreferences(EMPTY_PREFERENCE)).success, false)
const values = normalisePreferences({ ...EMPTY_PREFERENCE, topic: '  AI  ', tags: 'AI policy, ai policy, , robotics', domains: ' BBC, apnews ', exclude_domains: 'example', languages: 'EN,en-us' })
assert.deepEqual(values.tags, ['ai_policy', 'robotics'])
assert.deepEqual(values.domains, ['bbc', 'apnews'])
assert.equal(PREFERENCE_SCHEMA.safeParse(values).success, true)
for (const invalid of [
  { ...values, topic: 'x'.repeat(501) }, { ...values, domains: ['https://bbc.com'] },
  { ...values, domains: ['bbc/path'] }, { ...values, domains: ['bbc..com'] }, { ...values, domains: ['bad-.example'] }, { ...values, exclude_domains: ['bbc'] },
  { ...values, languages: ['es'] }, { ...values, tags: Array.from({ length: 31 }, (_, i) => `tag_${i}`) }
])
  assert.equal(PREFERENCE_SCHEMA.safeParse(invalid).success, false)
const createError = input => Object.assign(new Error(input.statusMessage), input)
const { sessionUser, requireSessionUser, requireSameOrigin } = await loadModule('../server/utils/userSession.ts', {
  createError, getHeader: (event, key) => event.headers?.[key], getRequestURL: () => new URL('http://localhost:3000')
}, ['sessionUser', 'requireSessionUser', 'requireSameOrigin'])
assert.equal(sessionUser({ context: {} }), null)
assert.throws(() => requireSessionUser({ context: {} }), error => error.statusCode === 401)
assert.throws(() => requireSameOrigin({ headers: { origin: 'https://evil.example' } }), error => error.statusCode === 403)
requireSameOrigin({ headers: { origin: 'http://localhost:3000' } })
async function verifyDatabase(db, label, schema) {
  await migrateUserDatabase(db, schema)
  await migrateUserDatabase(db, schema)
  const preferences = createPreferenceRepository(db)
  assert.equal(await preferences.readPreference('alice'), null)
  await preferences.savePreference('conflict-user', values, 0)
  const competing = await Promise.all([preferences.savePreference('conflict-user', { ...values, topic: 'First edit' }, 1), preferences.savePreference('conflict-user', { ...values, topic: 'Second edit' }, 1)])
  assert.equal(competing.filter(Boolean).length, 1, 'Only one simultaneous edit may replace the same version')
  const saved = await preferences.savePreference('alice', values, 0)
  assert.equal(saved.version, 1)
  assert.equal(await preferences.readPreference('bob'), null)
  assert.equal(await preferences.savePreference('alice', values, 0), null)
  assert.equal(await preferences.savePreference('alice', { ...values, topic: 'Updated' }, 99), null)
  assert.equal(await preferences.clearPreference('alice', 99), false)
  assert.equal(await preferences.clearPreference('alice', 1), true)
  assert.equal(await preferences.readPreference('alice'), null)
  const recreated = await preferences.savePreference('alice', values, 0)
  assert.equal(recreated.version, 3)
  assert.equal(await preferences.savePreference('alice', values, 1), null, 'old version must not match recreated preference')
  await preferences.queueCleanup('alice', 'event-1')
  assert.equal(await preferences.savePreference('alice', values, 0), null)
  await preferences.cleanupAccount('alice', 'event-1')
  await preferences.cleanupAccount('alice', 'event-1')
  assert.equal(await preferences.readPreference('alice'), null)
  assert.equal(await preferences.savePreference('alice', values, 0), null, 'deleted account cannot recreate preferences')
  await preferences.savePreference('bob', values, 0)
  assert.equal((await preferences.readPreference('bob')).topic, 'AI')
  const repository = createContinuationRepository(db)
  const expiry = new Date(Date.now() + 86400000).toISOString()
  const reservations = await Promise.all(Array.from({ length: 8 }, () => repository.reserve('concurrent', expiry)))
  assert.equal(reservations.filter(Boolean).length, 1)
  const reservation = reservations.find(Boolean)
  assert.equal(await repository.complete('concurrent', 'wrong-owner'), false)
  await repository.release('concurrent', 'wrong-owner')
  assert.equal(await repository.reserve('concurrent', expiry), null)
  await repository.release('concurrent', reservation)
  const retry = await repository.reserve('concurrent', expiry)
  assert.ok(retry)
  assert.equal(await repository.complete('concurrent', retry), true)
  assert.equal(await repository.reserve('concurrent', expiry), null)
  const stale = await repository.reserve('stale', expiry)
  await db.updateTable('continuation_usage').set({ reserved_until: '2000-01-01T00:00:00.000Z' }).where('context_hash', '=', 'stale').execute()
  const replacement = await repository.reserve('stale', expiry)
  assert.ok(replacement)
  assert.equal(await repository.complete('stale', stale), false)
  assert.equal(await repository.complete('stale', replacement), true)
  const { withContinuation, continuationState, verifyContinuation, signContinuation, readContinuation } = await loadModule('../server/utils/continuationAccess.ts', {
    createHmac, timingSafeEqual, createError, getUserDatabase: () => db, createContinuationRepository, sessionUser
  }, ['withContinuation', 'continuationState', 'verifyContinuation', 'signContinuation', 'readContinuation'])
  const event = { context: { beans_anonymous_id: 'browser-1', beans_identity_expiry: Date.now() + 30 * 86400000, beans_protection_secret: 's'.repeat(64) } }
  for (const surface of ['home', 'category', 'source', 'search', 'related']) {
    const context = { surface, context: `${surface}-page`, criteria: { q: 'AI' } }
    let upstream = 0
    const load = async () => {
      upstream++
      return { data: [], next_cursor: 'next' }
    }
    const access = await continuationState(event, context, 'cursor')
    assert.equal(access.state, 'available')
    const expired = signContinuation({ ...verifyContinuation(access.token, event.context.beans_protection_secret), expires_at: Date.now() - 1 }, event.context.beans_protection_secret)
    await assert.rejects(withContinuation(event, context, 'cursor', expired, load), error => error.statusCode === 409)
    assert.equal(verifyContinuation(access.token + 'tampered', event.context.beans_protection_secret), null)
    await assert.rejects(withContinuation(event, context, 'cursor', undefined, load), error => error.statusCode === 400)
    await assert.rejects(withContinuation(event, context, 'wrong-cursor', access.token, load), error => error.statusCode === 400)
    await assert.rejects(withContinuation(event, { ...context, context: 'another-page' }, 'cursor', access.token, load), error => error.statusCode === 400)
    assert.equal(upstream, 0)
    await assert.rejects(withContinuation(event, context, 'cursor', access.token, async () => {
      throw createError({ statusCode: 503, statusMessage: 'Timeout' })
    }))
    assert.equal((await continuationState(event, context, 'cursor')).state, 'available')
    await withContinuation(event, context, 'cursor', access.token, load)
    assert.equal(upstream, 1)
    assert.equal((await continuationState(event, context, 'next')).state, 'sign_in_required')
    await assert.rejects(withContinuation(event, context, 'cursor', access.token, load), error => error.statusCode === 403)
    assert.equal(upstream, 1, 'blocked continuation must do no upstream work')
    assert.equal((await continuationState(event, context, null)).state, 'exhausted')
    event.context.auth = () => ({ isAuthenticated: true, userId: 'bob' })
    await withContinuation(event, context, 'cursor', access.token, load)
    const authenticated = await continuationState(event, context, 'next')
    assert.equal(authenticated.state, 'authenticated_available')
    event.context.auth = () => ({ isAuthenticated: true, userId: 'carol' })
    await assert.rejects(withContinuation(event, context, 'next', authenticated.token, load), error => error.statusCode === 400)
    assert.equal(readContinuation(event, authenticated.token, undefined, undefined, true).context, context.context, 'Public contexts can renew access after account changes')
    event.context.auth = () => ({ isAuthenticated: true, userId: 'bob' })
    const private_context = { ...context, criteria: { personalized: true, filters: { topic: 'private' } } }
    const private_access = await continuationState(event, private_context, 'next')
    event.context.auth = () => ({ isAuthenticated: true, userId: 'carol' })
    assert.throws(() => readContinuation(event, private_access.token, undefined, undefined, true), error => error.statusCode === 400, 'Private filters cannot transfer to a different account')
    delete event.context.auth
    await assert.rejects(withContinuation(event, context, 'next', authenticated.token, load), error => error.statusCode === 401)
  }
  const unavailable = await loadModule('../server/utils/continuationAccess.ts', {
    createHmac, timingSafeEqual, createError, getUserDatabase: () => { throw new Error('Storage unavailable') }, createContinuationRepository, sessionUser
  }, ['withContinuation', 'continuationState'])
  const unavailable_context = { surface: 'home', context: 'unavailable', criteria: {} }
  const unavailable_access = await unavailable.continuationState(event, unavailable_context, 'cursor')
  assert.equal(unavailable_access.state, 'retryable_error')
  await assert.rejects(unavailable.withContinuation(event, unavailable_context, 'cursor', unavailable_access.token, async () => {
    throw new Error('Must not load content')
  }), error => error.statusCode === 503)
  console.info(`${label}: migration, preference ownership/conflicts/deletion, atomic continuation, retries, token binding, all five surfaces passed.`)
}
const sqlite = createUserDatabase('sqlite::memory:')
try {
  await verifyDatabase(sqlite, 'SQLite')
} finally {
  await sqlite.destroy()
}
if (process.argv.includes('--postgres')) {
  try {
    loadEnvFile()
  } catch { /* CI can supply environment. */ }
  const schema = `beans_verify_${randomUUID().replaceAll('-', '')}`
  const admin = new pg.Pool({ connectionString: process.env.BEANS_APP_USER_DB, max: 1, connectionTimeoutMillis: 5000 })
  let postgres
  try {
    await admin.query(`CREATE SCHEMA ${schema}`)
    postgres = new Kysely({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.BEANS_APP_USER_DB, max: 4, options: `-c search_path=${schema}`, connectionTimeoutMillis: 5000 }) }) })
    await verifyDatabase(postgres, 'PostgreSQL isolated schema', schema)
  } finally {
    await postgres?.destroy()
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await admin.end()
  }
}
console.info('User-management verification passed.')
