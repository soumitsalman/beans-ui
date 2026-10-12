import { enforceRateLimit } from '../utils/rateLimit'
import { createPresentationActions } from '../utils/presentationActions'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
  const is_page = path === '/' || (path === '/search' && ['q', 'tags', 'sources'].some(key => getRequestURL(event).searchParams.get(key)?.trim()))
    || /^\/(categories|articles|sources)\/[^/]+\/?$/.test(path)
  const is_action = path.startsWith('/api/actions/')
  if (!is_page && !is_action) return
  event.context.beans_rate_limited = true
  await enforceRateLimit(event)
  if (is_page && event.method === 'GET') {
    // This function lives on the real request event, never in a public header/token.
    event.context.beans_action = createPresentationActions(event)
  }
})
