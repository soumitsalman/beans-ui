import { createError, readBody } from 'h3'
import type { ClientTelemetryEvent } from '../../shared/types/telemetry'

const MAX_PATH_LENGTH = 160
const MAX_FROM_PATH_LENGTH = 160

function safePath(value: unknown, max_length: number): string | undefined {
  if (typeof value !== 'string') return undefined

  const path = value.trim().split(/[?#]/, 1)[0] || ''
  if (!path.startsWith('/')) return undefined

  return path.slice(0, max_length)
}

function safeCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : undefined
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ClientTelemetryEvent>>(event)
  const path = safePath(body?.path, MAX_PATH_LENGTH)

  if (!body || !path || (body.event !== 'page_view' && body.event !== 'content_load')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid telemetry event.' })
  }

  console.info(JSON.stringify({
    event: 'client_telemetry',
    event_name: body.event,
    path,
    from_path: safePath(body.from_path, MAX_FROM_PATH_LENGTH),
    surface: body.surface,
    feed: body.feed,
    action: body.action,
    outcome: body.outcome,
    cursor_present: body.cursor_present === true,
    requested_count: safeCount(body.requested_count),
    received_count: safeCount(body.received_count),
    visible_count: safeCount(body.visible_count)
  }))

  return { ok: true }
})
