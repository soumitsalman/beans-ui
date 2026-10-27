import { clerkMiddleware } from '@clerk/nuxt/server'

export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/_nuxt/') || event.path.startsWith('/api/webhooks/')) return
  try {
    const authenticate = clerkMiddleware({ authorizedParties: [getRequestURL(event).origin] })
    return await authenticate(event as unknown as Parameters<typeof authenticate>[0])
  } catch {
    // A provider outage must not turn public reading into an error page.
    event.context.beans_auth_unavailable = true
    event.context.__clerk_initial_state = { userId: null, sessionId: null, orgId: null, orgRole: null, orgSlug: null, orgPermissions: null } as never
  }
})
