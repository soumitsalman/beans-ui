import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { registerHooks } from 'node:module'
import { ACTION_TIMEOUT_MS, CLIENT_ACTION_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '../shared/actionTiming.ts'
import { retryAfterSeconds } from '../app/utils/resourceError.ts'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '../../shared/actionTiming') return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context)
    return nextResolve(specifier, context)
  }
})
const { withActionDeadline } = await import('../server/utils/actionDeadline.ts')

assert.equal(UPSTREAM_TIMEOUT_MS, 90_000)
assert.equal(ACTION_TIMEOUT_MS, 95_000)
assert.equal(CLIENT_ACTION_TIMEOUT_MS, 100_000)
assert.ok(ACTION_TIMEOUT_MS > UPSTREAM_TIMEOUT_MS, 'Action assembly allows the full API retrieval timeout')
assert.ok(CLIENT_ACTION_TIMEOUT_MS > ACTION_TIMEOUT_MS, 'The browser waits for the server deadline')

let _signal
const started_at = Date.now()
await assert.rejects(withActionDeadline(async (signal) => {
  _signal = signal
  return new Promise(() => {})
}, 30), error => error.statusCode === 503)
assert.ok(Date.now() - started_at < 1000, 'A stalled action is bounded')
assert.equal(_signal.aborted, true, 'Deadline aborts outstanding upstream requests')
assert.equal(await withActionDeadline(async () => 'complete', 30), 'complete')
await delay(50)
assert.equal(await withActionDeadline(async () => 'next'), 'next', 'Successful action timers are cleaned up')
await assert.rejects(withActionDeadline(async () => {
  throw new Error('upstream')
}), /upstream/)
assert.equal(retryAfterSeconds({ response: { headers: new Headers({ 'retry-after': '12' }) } }), 12)
assert.equal(retryAfterSeconds({ data: { data: { retry_after: 8 } } }), 8)
assert.equal(retryAfterSeconds({}), 60)
console.log('Action loading checks passed: stalled deadlines, upstream abort, successful completion, errors and Retry-After parsing.')
