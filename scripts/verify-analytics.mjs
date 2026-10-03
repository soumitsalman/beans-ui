import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const EVENTS = []
const HOOKS = new Map()
let _watch_navigation
const PAGE = { value: { path: '/search', title: 'Search | Beans' } }
const WINDOW = {
  location: new URL('https://beans.cafecito.tech/search?q=private-topic&tags=private-tag&utm_source=newsletter&utm_campaign=weekly'),
  gtag: (...args) => EVENTS.push(args)
}
const DOCUMENT = { title: 'Search | Beans' }
const RUNTIME = {
  $router: {
    currentRoute: { value: { path: '/search', fullPath: '/search?q=private-topic' } }
  },
  hook: (name, callback) => HOOKS.set(name, callback)
}

function compileModule(path, bindings) {
  const module_exports = {}
  const source = readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.client', 'true')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  runInNewContext(compiled, { exports: module_exports, URL, URLSearchParams, window: WINDOW, document: DOCUMENT, ...bindings })
  return module_exports
}

const { useGoogleAnalytics } = compileModule('../app/composables/useGoogleAnalytics.ts', {
  useRuntimeConfig: () => ({ public: { ga_measurement_id: 'G-FIXTURE123' } }),
  useServerHead: () => undefined
})
const analytics = useGoogleAnalytics()
const plugin = compileModule('../app/plugins/google-analytics.ts', {
  defineNuxtPlugin: factory => factory,
  useGoogleAnalytics: () => analytics,
  useState: () => PAGE,
  watch: (_sources, callback) => {
    _watch_navigation = callback
    callback()
  },
  useNuxtApp: () => RUNTIME
}).default
plugin()
_watch_navigation()
HOOKS.get('app:mounted')()
assert.equal(EVENTS.filter(event => event[1] === 'page_view').length, 1, 'Initial mount and suspense completion do not double count')
assert.match(EVENTS[0][2].page_location, /utm_source=newsletter/)
assert.match(EVENTS[0][2].page_location, /utm_campaign=weekly/)
assert.ok(!EVENTS[0][2].page_location.includes('private-'), 'Search terms are stripped while campaign attribution remains')

WINDOW.location = new URL('https://beans.cafecito.tech/articles/article-1')
RUNTIME.$router.currentRoute.value.fullPath = '/articles/article-1'
RUNTIME.$router.currentRoute.value.path = '/articles/article-1'
_watch_navigation()
assert.equal(EVENTS.length, 1, 'Wait for the destination metadata instead of sending the previous title')
DOCUMENT.title = 'Fixture news | Beans coverage'
PAGE.value = { path: '/articles/article-1', title: DOCUMENT.title }
_watch_navigation()
_watch_navigation()
assert.equal(EVENTS.filter(event => event[1] === 'page_view').length, 2, 'Navigation creates one page view')
assert.equal(EVENTS[1][2].page_title, DOCUMENT.title)

WINDOW.location = new URL('https://beans.cafecito.tech/articles/article-1?utm_source=test')
RUNTIME.$router.currentRoute.value.fullPath = '/articles/article-1?utm_source=test'
_watch_navigation()
assert.equal(EVENTS.filter(event => event[1] === 'page_view').length, 3, 'Query navigation records a view when the head is unchanged')
_watch_navigation()
assert.equal(EVENTS.filter(event => event[1] === 'page_view').length, 3, 'Head rendering does not duplicate the router event')
RUNTIME.$router.currentRoute.value.fullPath += '#main-content'
_watch_navigation()
assert.equal(EVENTS.filter(event => event[1] === 'page_view').length, 3, 'Skip links and other fragment changes do not count as page navigation')

WINDOW.location = new URL('https://beans.cafecito.tech/search?q=private-topic')
analytics.trackEvent('search_submit', { has_topic: true, tag_count: 1, source_count: 0 })
const search_event = EVENTS.at(-1)
assert.equal(search_event[1], 'search_submit')
assert.equal(search_event[2].page_location, 'https://beans.cafecito.tech/search')
assert.ok(!JSON.stringify(search_event).includes('private-topic'), 'Explicit growth events do not contain raw queries')
console.log('Analytics checks passed: one page view per navigation, campaign attribution and search-query privacy.')
