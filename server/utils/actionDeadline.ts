import { ACTION_TIMEOUT_MS } from '../../shared/actionTiming'

export async function withActionDeadline<T>(execute: (signal: AbortSignal) => Promise<T>, timeout_ms = ACTION_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  let _timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    _timer = setTimeout(() => {
      const message = 'News took too long to load. Please retry.'
      const error = Object.assign(new Error(message), { statusCode: 503, statusMessage: message })
      controller.abort(error)
      reject(error)
    }, timeout_ms)
  })
  try {
    return await Promise.race([execute(controller.signal), deadline])
  } finally {
    clearTimeout(_timer)
  }
}
