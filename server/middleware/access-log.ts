const IGNORED_PATH_PREFIXES = ['/_nuxt/']

function pathWithoutQuery(value: string): string {
  return value.split(/[?#]/, 1)[0] || '/'
}

function shouldLogPath(path: string): boolean {
  return !IGNORED_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
}

export default defineEventHandler((event) => {
  const path = pathWithoutQuery(event.path || '/')
  if (!shouldLogPath(path)) return

  const started_at = Date.now()
  const method = event.method || 'GET'
  const response = event.node.res

  console.info(JSON.stringify({
    event: 'route_request',
    method,
    path,
    timestamp: new Date().toISOString()
  }))

  response.once('finish', () => {
    console.info(JSON.stringify({
      event: 'route_response',
      method,
      path,
      status_code: response.statusCode,
      duration_ms: Date.now() - started_at
    }))
  })
})
