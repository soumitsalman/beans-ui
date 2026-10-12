import { disconnectRateLimitStore } from '../utils/rateLimitStore'

export default defineNitroPlugin((nitro_app) => {
  nitro_app.hooks.hook('close', disconnectRateLimitStore)
})
