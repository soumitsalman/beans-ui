import { createHash } from 'node:crypto'
import { getCookie } from 'h3'
import { HOME_DISCOVERY_COOKIE, homeDiscoveryCookieActive } from '#shared/homeDiscovery'

export default defineNitroPlugin((nitro_app) => {
  nitro_app.hooks.hook('render:response', (response, { event }) => {
    response.headers ||= {}
    const status = response.statusCode || getResponseStatus(event)
    const request_url = getRequestURL(event)
    const pathname = request_url.pathname
    const discovery_active = pathname === '/' && (
      homeDiscoveryCookieActive(getCookie(event, HOME_DISCOVERY_COOKIE))
      || Boolean(request_url.searchParams.get('q')?.trim())
    )
    if (pathname === '/search' || discovery_active || status !== 200) {
      response.headers['cache-control'] = 'private, no-store'
      return
    }
    if (typeof response.body !== 'string') return
    const etag = `W/"${createHash('sha256').update(response.body).digest('base64url')}"`
    response.headers['cache-control'] = 'public, max-age=0, must-revalidate'
    response.headers.etag = etag
    if (getHeader(event, 'if-none-match')?.split(',').map(value => value.trim()).includes(etag)) {
      response.statusCode = 304
      response.body = ''
    }
  })
})
