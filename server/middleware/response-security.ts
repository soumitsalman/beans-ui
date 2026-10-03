export default defineEventHandler((event) => {
  const secure = getRequestURL(event).protocol === 'https:' || getHeader(event, 'x-forwarded-proto') === 'https'
  if (secure) setHeader(event, 'strict-transport-security', 'max-age=31536000')
  setHeaders(event, {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'content-security-policy': [
      'default-src \'self\'',
      `script-src 'self' 'unsafe-inline' ${import.meta.dev ? '\'unsafe-eval\' ' : ''}https://www.googletagmanager.com https://tally.so https://*.tally.so`,
      'style-src \'self\' \'unsafe-inline\'',
      'img-src \'self\' https: data: blob:',
      'font-src \'self\' data:',
      `connect-src 'self' https: ${import.meta.dev ? 'ws: wss:' : ''}`,
      'frame-src https://tally.so https://*.tally.so',
      'object-src \'none\'',
      'base-uri \'self\'',
      'frame-ancestors \'none\'',
      'form-action \'self\' https://tally.so',
      ...(secure ? ['upgrade-insecure-requests'] : [])
    ].join('; ')
  })
})
