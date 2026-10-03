import type { Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  const { trackEvent, measurement_id } = useGoogleAnalytics()
  if (!measurement_id) return
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('main a[data-publisher-link][href]') : null
    if (!(target instanceof HTMLAnchorElement) || !['http:', 'https:'].includes(target.protocol)) return
    if (target.host === window.location.host || ['beans.cafecito.tech', 'cafecito-beans-app.fly.dev'].includes(target.hostname)) return
    if (target.getAttribute('aria-label')?.startsWith('Open image')) return
    trackEvent('publisher_click', { publisher_host: target.hostname })
  })
  // Buffered observers include initial paint; do not wait for third-party mount hooks.
  const landing_path = window.location.pathname
  const VITALS_OPTIONS = { reportAllChanges: useRuntimeConfig().public.vitals_report_all_changes }
  void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    const report = (metric: Metric) => {
      trackEvent('web_vitals', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_id: metric.id,
        page_path: landing_path,
        page_location: `${window.location.origin}${landing_path}`,
        non_interaction: true
      })
    }
    onCLS(report, VITALS_OPTIONS)
    onINP(report, VITALS_OPTIONS)
    onLCP(report, VITALS_OPTIONS)
  }).catch(error => console.warn('Web Vitals collection unavailable:', error))
})
