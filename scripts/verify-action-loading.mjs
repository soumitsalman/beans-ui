import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { withActionDeadline } from '../server/utils/actionDeadline.ts'
import { retryAfterSeconds } from '../app/utils/resourceError.ts'

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
