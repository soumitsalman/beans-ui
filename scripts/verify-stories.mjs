import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { defaultScoreThreshold, NEWS_LANGUAGES } from '../shared/news.ts'

// Execute the actual service code with a deterministic upstream; Nuxt globals
// and the action-schema boundary are supplied separately by the integration suite.
async function loadService(path, bindings, exports) {
  const source = stripTypeScriptTypes(await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*\n/gm, '').replace(/^export /gm, '')
  return new Function(...Object.keys(bindings), `${source}\nreturn { ${exports.join(', ')} };`)(...Object.values(bindings))
}
const { sourceFavicon } = await loadService('../app/utils/source.ts', {}, ['sourceFavicon'])
const { createBeansClient, createEspressoClient } = await loadService('../server/utils/beansClient.ts', { defaultScoreThreshold, NEWS_LANGUAGES }, ['createBeansClient', 'createEspressoClient'])
const INPUTS = Object.fromEntries(['feed', 'search', 'story', 'story_enrichment', 'source', 'coverage', 'related', 'signals'].map(name => [name, { parse: value => value, safeParse: value => ({ success: true, data: value }) }]))
const CALLS = []
const STORIES = Array.from({ length: 10 }, (_, i) => ({ id: `story-${i}`, title: `Story ${i}`, last_published_at: '2026-10-12T12:00:00Z', article_count: 245, published_at: '2000-01-01', trend: { related: 999 } }))
let _mode = 'normal'
async function fetchApi(api, path, query = {}) {
  assert.ok(!/(^|\/)private(?:\/|$)/i.test(path), `Stale route: ${path}`)
  CALLS.push({ api, path, query })
  if (path === 'preview/stories') {
    if (_mode === 'fail') throw new Error('Upstream failure')
    if (_mode === 'empty-page') return { data: [], pagination: { next_cursor: '5' } }
    if (_mode === 'repeated') return { data: [], pagination: { next_cursor: query.cursor } }
    const excluded = new Set(query.exclude_ids ?? [])
    const offset = Number(query.cursor ?? 0)
    const stories = STORIES.filter(story => !excluded.has(story.id))
    const next = offset + query.limit
    return { data: stories.slice(offset, next), pagination: { next_cursor: next < stories.length ? String(next) : null } }
  }
  if (/^preview\/stories\/[^/]+$/.test(path)) return { data: STORIES[0] }
  if (path.endsWith('/articles') && query.limit === 20) {
    const story_id = path.split('/')[2]
    if (_mode === 'empty') return { data: [], pagination: { next_cursor: 'unused' } }
    const size = _mode === 'batch' ? 30 : 20
    return { data: Array.from({ length: size }, (_, i) => ({ id: `${story_id}-article-${i}`, title: `Article ${i}`, source: { id: `source-${i}`, favicon: `https://example.com/${i % (_mode === 'icons' ? 7 : 3)}.ico` } })), pagination: { next_cursor: 'unused' } }
  }
  if (path.endsWith('/articles')) {
    const offset = Number(query.cursor ?? 0)
    const count = query.limit === 100 ? 245 : 12
    const next = Math.min(offset + query.limit, count)
    return { data: Array.from({ length: next - offset }, (_, i) => ({ id: `coverage-${offset + i}`, title: `Coverage ${offset + i}` })), pagination: { next_cursor: next < count ? String(next) : null } }
  }
  if (path === 'preview/confidence') {
    return { data: query.ids.split(',').map(id => ({ id, confidence: id.endsWith('-0') ? 'low' : id.endsWith('-1') ? 'high' : null })) }
  }
  if (path === 'articles/latest') {
    if (_mode === 'content-fallback' && query.content_type) return { data: [] }
    if (_mode === 'fallback' && (query.content_type || query.languages)) return { data: [] }
    return { data: [{ id: 'source-article', title: 'Source article', source: { id: 'source-1' } }] }
  }
  throw new Error(`Unexpected route ${path}`)
}
const { createPresentationActions } = await loadService('../server/utils/presentationActions.ts', {
  createBeansClient, createEspressoClient, sourceFavicon, ACTION_INPUTS: INPUTS,
  useRuntimeConfig: () => ({ beans_api_base_url: 'beans', espresso_api_base_url: 'espresso', public: { default_score_threshold: 0.6 } }),
  fetchPresentationApi: (base, path, query) => fetchApi(base, path, query),
  withActionDeadline: fn => fn(new AbortController().signal),
  createError: value => Object.assign(new Error(value.statusMessage), value), setHeader: () => {}
}, ['createPresentationActions'])
const execute = createPresentationActions({})
const feed = await execute('feed', { q: 'topic', tags: ['tag'], categories: ['category'] })
assert.equal(feed.articles.length, 5)
assert.equal(feed.articles[0].published_at, STORIES[0].last_published_at)
assert.equal(feed.articles[0].article_count, 245)
assert.equal(feed.articles[0].source, undefined)
assert.ok(feed.articles.every(story => !story.confidence && !story.other_publishers), 'Feed returns renderable stories before optional enrichment')
assert.equal(CALLS.length, 1, 'Initial feed does not await favicon or confidence requests')
const enrichment = await execute('story_enrichment', { ids: feed.articles.map(story => story.id) })
assert.ok(feed.articles.every(story => enrichment[story.id].confidence === 'high' && enrichment[story.id].other_publishers.length === 3))
assert.equal(CALLS.filter(call => call.path.endsWith('/articles')).length, 5, 'One favicon request per story even with fewer than five icons and an available cursor')
assert.ok(CALLS.filter(call => call.path.endsWith('/articles')).every(call => call.query.limit === 20 && !call.query.cursor))
const batch = CALLS.find(call => call.path === 'preview/confidence')
assert.equal(batch.query.ids.split(',').length, 100)
assert.ok(!batch.query.ids.split(',').some(id => STORIES.some(story => story.id === id)), 'Confidence uses article IDs')
for (const call of CALLS.filter(call => call.path === 'preview/stories')) {
  assert.deepEqual(call.query.languages, NEWS_LANGUAGES)
  assert.equal(call.query.content_type, 'news')
  assert.equal(call.query.limit, 5)
  assert.equal(call.query.sort, undefined)
  assert.equal(call.query.exclude_ids, undefined)
  assert.equal(call.query.q, 'topic')
  assert.equal(call.query.score_threshold, 0.6)
  assert.deepEqual(call.query.categories, ['category'])
}
CALLS.length = 0
const more = await execute('feed', { cursor: feed.cursor, from: feed.from, seen_ids: feed.articles.map(story => story.id), q: 'topic', tags: ['tag'], categories: ['category'] })
assert.equal(CALLS.filter(call => call.path === 'preview/stories').length, 1)
assert.equal(CALLS.find(call => call.path === 'preview/stories').query.cursor, '5')
assert.equal(CALLS.find(call => call.path === 'preview/stories').query.from, feed.from)
assert.equal(more.articles.length, 5)
assert.equal(more.cursor, null)
assert.ok(more.articles.every(story => !feed.articles.some(previous => previous.id === story.id)))
assert.ok(CALLS.filter(call => call.path === 'preview/stories').every(call => call.query.limit === 5 && !call.query.sort && !call.query.exclude_ids))
CALLS.length = 0
_mode = 'empty-page'
const empty_page = await execute('feed', {})
assert.equal(empty_page.cursor, '5')
assert.equal(CALLS.length, 1, 'Empty pages retain the cursor without making fill requests')
_mode = 'repeated'
const repeated = await execute('feed', { cursor: '5' })
assert.equal(repeated.cursor, null, 'Repeated cursors stop continuation')
_mode = 'fail'
const failed = await execute('feed', { cursor: '5', from: feed.from })
assert.equal(failed.cursor, '5', 'Failed More retains its cursor for retry')
assert.equal(failed.from, feed.from)
assert.ok(failed.error_message)
CALLS.length = 0
_mode = 'batch'
await execute('story_enrichment', { ids: STORIES.slice(0, 5).map(story => story.id) })
const batches = CALLS.filter(call => call.path === 'preview/confidence').map(call => call.query.ids.split(','))
assert.ok(batches.every(ids => ids.length <= 100))
assert.equal(batches.length, 2)
assert.ok(batches[1].every(id => id.startsWith('story-4-')), 'Later batches omit stories already resolved')
_mode = 'normal'
CALLS.length = 0
const detail = await execute('story', { id: 'story-0' })
assert.equal(detail.story.confidence, 'high')
assert.equal(detail.coverage.data.length, 245)
assert.equal(detail.coverage.next_cursor, null)
const coverage = CALLS.filter(call => call.path.endsWith('/articles') && call.query.limit === 100)
assert.deepEqual(coverage.map(call => call.query.cursor), [undefined, '100', '200'])
assert.ok(coverage.every(call => !call.query.languages && !call.query.content_type))
const related = CALLS.find(call => call.path.endsWith('/articles') && call.query.limit === 5)
assert.deepEqual(related.query.languages, NEWS_LANGUAGES)
assert.equal(related.query.content_type, 'news')
await execute('related', { id: 'story-0', cursor: detail.related.next_cursor })
assert.equal(CALLS.at(-1).query.cursor, '5')
CALLS.length = 0
_mode = 'icons'
const many_icons = await execute('story_enrichment', { ids: STORIES.slice(0, 5).map(story => story.id) })
assert.ok(Object.values(many_icons).every(story => story.other_publishers.length === 5))
_mode = 'empty'
CALLS.length = 0
const empty_sources = await execute('story_enrichment', { ids: STORIES.slice(0, 5).map(story => story.id) })
assert.ok(Object.values(empty_sources).every(story => !story.confidence && !story.other_publishers.length))
assert.equal(CALLS.filter(call => call.path.endsWith('/articles')).length, 5)
assert.equal(CALLS.filter(call => call.path === 'preview/confidence').length, 0)
const client = createBeansClient(fetchApi, 0.6)
CALLS.length = 0
_mode = 'fallback'
await client.fetchSourceArticles('source-1', { cursor: 'next' })
assert.equal(CALLS.length, 3)
assert.ok(CALLS.every(call => call.path === 'articles/latest' && call.query.sources[0] === 'source-1' && call.query.cursor === 'next' && call.query.limit === 5 && call.query.sort === 'recent'))
assert.equal(CALLS[0].query.content_type, 'news')
assert.equal(CALLS[1].query.content_type, undefined)
assert.deepEqual(CALLS[1].query.languages, NEWS_LANGUAGES)
assert.equal(CALLS[2].query.languages, undefined)
for (const [mode, expected_calls] of [['normal', 1], ['content-fallback', 2]]) {
  CALLS.length = 0
  _mode = mode
  await client.fetchSourceArticles('source-1', { cursor: 'next' })
  assert.equal(CALLS.length, expected_calls, 'Source fallback stops at the first non-empty response')
  assert.ok(CALLS.every(call => call.path === 'articles/latest' && call.query.sources[0] === 'source-1' && call.query.cursor === 'next'))
  assert.deepEqual(CALLS.at(-1).query.languages, NEWS_LANGUAGES)
}
CALLS.length = 0
await client.fetchArticlePublishers('story-0')
assert.equal(CALLS[0].path, 'preview/stories/story-0/articles', 'Source/search article-card publishers use preview')
assert.equal(CALLS[0].query.limit, 50)
console.log('Story checks passed: immediate five-story cursor pages, deferred favicon/confidence enrichment, mapping, filters, cursor safety, favicon limits, confidence batching/early stopping/highest value, independent coverage/related pagination, and unchanged source fallback.')
