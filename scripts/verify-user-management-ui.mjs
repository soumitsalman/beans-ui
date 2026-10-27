import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'

const { ref, computed, unref, watch, nextTick } = await import(createRequire(import.meta.resolve('nuxt')).resolve('vue'))

async function loadModule(path, bindings, names) {
  const source = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*\n/gm, '').replace(/^export /gm, '').replaceAll('import.meta.server', 'false')
  return new Function(...Object.keys(bindings), `${source}\nreturn { ${names.join(', ')} };`)(...Object.values(bindings))
}
const account = { session: ref({ signed_in: false, preference: null }), generation: ref(0), signed_out_revision: ref(0) }
let renewals = 0
const { useContinuationAccess } = await loadModule('../app/composables/useContinuationAccess.ts', {
  ref, watch, useAccount: () => account, useActionCooldown: () => ({ startCooldown: () => {} }),
  $fetch: async (path) => {
    assert.equal(path, '/api/account/continuation', 'Auth transition only renews access; it does not load content')
    renewals++
    return { state: account.session.value.signed_in ? 'authenticated_available' : 'sign_in_required', token: 'renewed', expires_at: Date.now() + 60000 }
  }
}, ['useContinuationAccess'])
let content_calls = 0
let defer_response
let fail_next = false
const { useNewsFeed } = await loadModule('../app/composables/useNewsFeed.ts', {
  ref, computed, unref, watch, nextTick, useAccount: () => account, useContinuationAccess,
  onMounted: () => {}, onScopeDispose: () => {}, useRoute: () => ({ path: '/' }),
  requestErrorMessage: () => 'Retry this request.', logClientEvent: () => {},
  useAsyncData: async (key, handler) => ({ data: ref(await handler()) }),
  useBeansActions: () => ({ executeAction: async (action, input) => {
    assert.equal(action, 'feed')
    const sequence = ++content_calls
    if (defer_response) await new Promise(resolve => defer_response(resolve))
    if (fail_next) {
      fail_next = false
      throw new Error('Temporary failure')
    }
    return {
      articles: Array.from({ length: 5 }, (_, index) => ({ id: `article-${sequence * 5 + index}` })),
      cursor: `cursor-${sequence}`, source_cursor: null, from: input.from || '2026-10-27', error_message: null,
      continuation_access: { state: account.session.value.signed_in ? 'authenticated_available' : sequence === 1 ? 'available' : 'sign_in_required', token: `token-${sequence}`, expires_at: Date.now() + 60000 }
    }
  } })
}, ['useNewsFeed'])
const feed = useNewsFeed()
await feed.initialiseFeed()
assert.equal(feed.articles.value.length, 5)
await Promise.all([feed.loadMore(), feed.loadMore(), feed.loadMore()])
assert.equal(content_calls, 2, 'Rapid clicks issue only one additional request')
assert.equal(feed.articles.value.length, 10)
assert.equal(feed.continuation_access.value.state, 'sign_in_required')
await feed.loadMore()
assert.equal(content_calls, 2, 'Visitor gate prevents a second client request')
account.session.value = { signed_in: true, preference: null }
await nextTick()
await nextTick()
assert.equal(renewals, 1)
assert.equal(feed.continuation_access.value.state, 'authenticated_available')
assert.equal(content_calls, 2, 'Sign-in must not automatically load another batch')
assert.equal(feed.articles.value.length, 10, 'Sign-in retains all rendered cards')
await feed.loadMore()
assert.equal(content_calls, 3)
assert.equal(feed.articles.value.length, 15)
fail_next = true
await feed.loadMore()
assert.equal(feed.articles.value.length, 15)
assert.equal(feed.error_message.value, 'Retry this request.')
await feed.retryFeed()
assert.equal(feed.articles.value.length, 20)
let release
// Keep a genuine in-flight request, then change identity before its response.
defer_response = (resolve) => {
  release = resolve
}
const pending = feed.loadMore()
await nextTick()
await nextTick()
assert.equal(typeof release, 'function')
account.generation.value++
release()
await pending
assert.equal(feed.articles.value.length, 20, 'An older identity response cannot append cards')
const stale_failure = feed.loadMore()
await nextTick()
await nextTick()
fail_next = true
account.generation.value++
release()
await stale_failure
assert.equal(feed.error_message.value, null, 'An older identity failure cannot replace the current error/prompt state')
defer_response = undefined
feed.personalized.value = true
account.session.value = { signed_in: false, preference: null }
account.signed_out_revision.value++
await nextTick()
await nextTick()
assert.equal(feed.personalized.value, false)
assert.equal(feed.articles.value.length, 5, 'Sign-out clears the old private feed and loads fresh public content')
console.info('Client access checks passed: duplicate-click guard, visitor gate, sign-in renewal without automatic loading, retained results, failure retry, and stale identity responses.')
