import { logClientEvent } from '~/utils/telemetry'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.afterEach((to, from) => {
    logClientEvent({
      event: 'page_view',
      path: to.path,
      from_path: from.path || undefined
    })
  })
})
