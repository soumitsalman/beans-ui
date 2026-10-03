export default defineEventHandler((event) => {
  const request_url = getRequestURL(event)
  if (request_url.hostname !== 'cafecito-beans-app.fly.dev') return
  const preferred_url = new URL(useRuntimeConfig(event).public.site_url)
  if (preferred_url.hostname === request_url.hostname) return
  return sendRedirect(event, `${preferred_url.origin}${request_url.pathname}${request_url.search}`, 308)
})
