import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'

const { ref } = await import(createRequire(import.meta.resolve('nuxt')).resolve('vue'))
async function loadModule(path, bindings, names) {
  const source = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8')).replace(/^import .*\n/gm, '').replace(/^export /gm, '').replaceAll('import.meta.client', 'true')
  return new Function(...Object.keys(bindings), `${source}\nreturn { ${names.join(', ')} };`)(...Object.values(bindings))
}
const { safeReturnPath } = await loadModule('../shared/account.ts', {}, ['safeReturnPath'])
const state = new Map()
const route = { path: '/', fullPath: '/?q=temporary#results' }
const redirects = []
const portal_urls = []
let sign_out_failure = false
let session_failure = false
let next_session = { signed_in: true, preference: null, error_message: null }
const clerk = ref({ loaded: true, signOut: async (options) => {
  if (sign_out_failure) throw new Error('Provider unavailable')
  redirects.push(options.redirectUrl)
} })
const { useAccount } = await loadModule('../app/composables/useAccount.ts', {
  safeReturnPath, useState: (key, initial) => {
    if (!state.has(key)) state.set(key, ref(initial()))
    return state.get(key)
  },
  useClerk: () => clerk, useRoute: () => route,
  useRequestFetch: () => async () => {
    if (session_failure) throw new Error('Session unavailable')
    return next_session
  },
  clearNuxtData: () => {}, window: { open: url => portal_urls.push(url) }
}, ['useAccount'])
const account = useAccount()
await account.refreshSession()
account.draft_dirty.value = true
await account.signOut()
assert.equal(redirects.length, 0)
assert.equal(account.session.value.signed_in, true)
account.draft_dirty.value = false
clerk.value.loaded = false
await account.signOut()
assert.equal(redirects.length, 0)
assert.equal(account.session.value.signed_in, true, 'Unavailable Clerk must not be presented as a completed sign-out')
assert.match(account.account_message.value, /still loading/)
clerk.value.loaded = true
sign_out_failure = true
await account.signOut()
assert.equal(account.session.value.signed_in, true)
assert.match(account.account_message.value, /did not complete/)
sign_out_failure = false
await account.signOut()
assert.equal(redirects.at(-1), '/?q=temporary#results', 'Home sign-out preserves the public query and hash')
assert.equal(account.session.value.signed_in, false)
assert.equal(account.session.value.preference, null)
assert.equal(account.signed_out_revision.value, 1)
account.openAuth(false, 'preferences')
assert.equal(account.return_path.value, '/?q=temporary#results')
assert.equal(account.pending_action.value, 'preferences')
account.openAuth(true, 'keys')
assert.equal(account.auth_mode.value, 'sign_in', 'An active authentication dialog cannot be duplicated')
assert.equal(portal_urls.length, 0)
account.auth_open.value = false
account.openKeys()
assert.equal(account.pending_action.value, 'keys')
assert.equal(portal_urls.length, 0, 'Visitor keys action opens authentication instead of the portal')
await account.refreshSession()
account.openKeys()
assert.deepEqual(portal_urls, ['https://developer.cafecito.tech'])
account.editor_open.value = false
account.openClearPreferences()
assert.equal(account.clear_requested.value, true)
assert.equal(account.editor_open.value, false, 'Home Clear opens a single confirmation instead of nesting newly mounted dialogs')
route.path = '/search'
route.fullPath = '/search?q=chips&tags=ai#results'
await account.signOut()
assert.equal(redirects.at(-1), route.fullPath)
await account.refreshSession()
route.path = '/account'
route.fullPath = '/account?return=https://evil.example'
await account.signOut()
assert.equal(redirects.at(-1), '/')
await account.refreshSession()
account.account_open.value = true
account.editor_open.value = true
account.offer_setup.value = true
account.draft_dirty.value = true
next_session = { signed_in: false, preference: null, error_message: 'Session expired.' }
await account.refreshSession()
assert.equal(account.session.value.signed_in, false)
assert.equal(account.account_open.value, false)
assert.equal(account.editor_open.value, false)
assert.equal(account.offer_setup.value, false)
assert.equal(account.draft_dirty.value, true, 'Expiry hides private controls while retaining the safe draft')
assert.equal(account.pending_action.value, 'preferences')
next_session = { signed_in: true, preference: null, error_message: null }
await account.refreshSession()
account.account_open.value = true
account.editor_open.value = true
session_failure = true
await account.refreshSession()
assert.equal(account.session.value.signed_in, false)
assert.equal(account.account_open.value, false)
assert.equal(account.editor_open.value, false)
assert.equal(account.draft_dirty.value, true)
console.info('Account client checks passed: unsaved/provider sign-out guards, safe query/hash returns, private-state clearing, duplicate authentication guard, separate portal handoff, and single clear confirmation.')
