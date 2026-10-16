import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'

const search_source = [
  await readFile(new URL('../app/utils/formatters.ts', import.meta.url), 'utf8'),
  await readFile(new URL('../app/utils/searchQuery.ts', import.meta.url), 'utf8')
].map(file => stripTypeScriptTypes(file).replace(/^import .*\n/gm, '').replace(/^export /gm, '')).join('\n')
const { searchCriteriaFromQuery, toSearchRouteQuery } = new Function(`${search_source}\nreturn { searchCriteriaFromQuery, toSearchRouteQuery };`)()

const source = stripTypeScriptTypes(await readFile(new URL('../server/utils/proxyApi.ts', import.meta.url), 'utf8'))
  .replace(/^import .*\n/gm, '').replace(/^export /gm, '')
let request
const { fetchPresentationApi } = new Function('createHash', 'UPSTREAM_TIMEOUT_MS', 'defineCachedFunction', '$fetch', 'createError', `${source}\nreturn { fetchPresentationApi };`)(
  createHash, 90000, fn => fn,
  async (url, options) => {
    request = { url, options }
    return { data: [] }
  }, value => Object.assign(new Error(value.statusMessage), value)
)
const query = {
  tags: ['GTA 6', 'Space News'],
  languages: ['en', 'en-us'],
  ids: ['article-1', 'article-2'],
  limit: 5,
  from: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
}
await fetchPresentationApi('http://127.0.0.1:8080', 'preview/stories', query)
assert.equal(request.url, 'http://127.0.0.1:8080/preview/stories')
assert.deepEqual(request.options.query, query)
assert.equal(request.options.query.q, undefined)
assert.equal(request.options.query.score_threshold, undefined)
assert.deepEqual(request.options.query.tags, ['GTA 6', 'Space News'])
assert.deepEqual(request.options.query.ids, ['article-1', 'article-2'])
const route_query = toSearchRouteQuery({ query: 'battery', tags: ['gta_6', 'space_news'], sources: ['bbc', 'apnews'] })
assert.deepEqual(route_query, { q: 'battery', tags: ['gta_6', 'space_news'], sources: ['bbc', 'apnews'] })
assert.deepEqual(toSearchRouteQuery({ query: '', tags: [], sources: [] }), {})
assert.deepEqual(searchCriteriaFromQuery(route_query), { query: 'battery', tags: ['gta_6', 'space_news'], sources: ['bbc', 'apnews'] })
assert.deepEqual(searchCriteriaFromQuery({ tags: 'gta_6,space_news', sources: 'bbc,apnews' }), { query: '', tags: ['gta_6', 'space_news'], sources: ['bbc', 'apnews'] })
console.log('Query checks passed: list filters stay arrays and the proxy delegates query encoding to $fetch.')
