import type { AnalyticsPageMetadata } from '~/types/analytics'

export default defineNuxtPlugin(() => {
  const { measurement_id, install, trackPageView } = useGoogleAnalytics()
  if (!measurement_id) return

  install()

  if (!import.meta.client) return

  let _last_path = ''
  const nuxt_app = useNuxtApp()
  const analytics_page = useState<AnalyticsPageMetadata | null>('analytics-page', () => null)
  function trackNavigation(): void {
    const current_route = nuxt_app.$router.currentRoute.value
    const path = current_route.fullPath.split('#')[0] || current_route.path
    if (analytics_page.value?.path !== current_route.path) return
    if (_last_path === path) return
    _last_path = path
    trackPageView({ path: current_route.path, title: analytics_page.value.title })
  }
  nuxt_app.hook('app:mounted', trackNavigation)
  watch([() => nuxt_app.$router.currentRoute.value.fullPath, analytics_page], trackNavigation, { immediate: true, flush: 'post' })
})
