import { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'

export const WINDOW_MS = 60_000
export const USER_LIMIT = 10
export const IP_LIMIT = 60

// All keys share a Redis Cluster hash tag; Redis TIME avoids Machine clock skew.
export const RATE_LIMIT_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local window = tonumber(ARGV[1])
local retry = 0
local remaining = tonumber(ARGV[3])
for index, key in ipairs(KEYS) do
  redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
  local count = redis.call('ZCARD', key)
  local limit = tonumber(ARGV[index + 2])
  remaining = math.min(remaining, limit - count - 1)
  if count >= limit then
    local first = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    retry = math.max(retry, math.ceil((tonumber(first[2]) + window - now) / 1000))
  end
end
if retry > 0 then return {0, retry, 0} end
for _, key in ipairs(KEYS) do
  redis.call('ZADD', key, now, ARGV[2])
  redis.call('PEXPIRE', key, window)
end
return {1, 0, math.max(0, remaining)}
`

interface RateLimitResult { allowed: boolean, retry_after: number, remaining: number }
let _redis: Redis | undefined
let _redis_url: string | undefined
let _redis_ready: Promise<void> | undefined
const MEMORY_WINDOWS = new Map<string, number[]>()

export async function consumeQuota(keys: string[], limits: number[], redis_url: string): Promise<RateLimitResult> {
  redis_url = redis_url.trim()
  if (!redis_url) {
    const now = Date.now()
    for (const [key, times] of MEMORY_WINDOWS) {
      const active = times.filter(time => time > now - WINDOW_MS)
      if (active.length) MEMORY_WINDOWS.set(key, active)
      else MEMORY_WINDOWS.delete(key)
    }
    const windows = keys.map(key => MEMORY_WINDOWS.get(key) ?? [])
    const retry_after = Math.max(0, ...windows.map((times, index) => times.length >= limits[index]!
      ? Math.ceil((times[0]! + WINDOW_MS - now) / 1000)
      : 0))
    if (retry_after) return { allowed: false, retry_after, remaining: 0 }
    windows.forEach((times, index) => MEMORY_WINDOWS.set(keys[index]!, [...times, now]))
    return { allowed: !retry_after, retry_after, remaining: Math.max(0, Math.min(...windows.map((times, index) => limits[index]! - times.length - 1))) }
  }
  if (!_redis || _redis_url !== redis_url) {
    _redis?.disconnect()
    _redis_url = redis_url
    _redis = new Redis(redis_url, { connectTimeout: 2000, commandTimeout: 2500, maxRetriesPerRequest: 0, enableOfflineQueue: false })
    // Avoid logging Redis credentials through connection error messages.
    _redis.on('error', () => {})
    _redis_ready = new Promise<void>((resolve, reject) => {
      const ready = () => {
        cleanup()
        resolve()
      }
      const failed = () => {
        cleanup()
        reject(new Error('Rate-limit Redis unavailable.'))
      }
      const cleanup = () => {
        _redis?.off('ready', ready)
        _redis?.off('error', failed)
      }
      _redis!.once('ready', ready)
      _redis!.once('error', failed)
    })
  }
  if (_redis.status !== 'ready') {
    try {
      await _redis_ready
    } catch {
      _redis.disconnect()
      _redis = undefined
      throw new Error('Rate-limit Redis unavailable.')
    }
  }
  const result = await _redis.eval(RATE_LIMIT_SCRIPT, keys.length, ...keys, WINDOW_MS, randomUUID(), ...limits) as number[]
  return { allowed: result[0] === 1, retry_after: result[1]!, remaining: result[2]! }
}

export function disconnectRateLimitStore(): void {
  _redis?.disconnect()
  _redis = undefined
  _redis_ready = undefined
}
