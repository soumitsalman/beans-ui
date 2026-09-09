export default defineNuxtPlugin(() => {
  const { measurement_id, install, trackPageView } = useGoogleAnalytics()
  if (!measurement_id) return

  install()

  if (!import.meta.client) return

  const router = useRouter()
  router.afterEach((to) => {
    window.setTimeout(() => {
      trackPageView({ path: to.path })
    }, 0)
  })
})
