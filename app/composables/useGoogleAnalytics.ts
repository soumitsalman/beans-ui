import type { AnalyticsPageView, GrowthEventName, GrowthEventParams, GtagPageViewParams } from '~/types/analytics'

const GA_SCRIPT_KEY = 'gtag-js'
const GA_INIT_KEY = 'gtag-init'
const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i

function readMeasurementId(): string {
  const measurement_id = String(useRuntimeConfig().public.ga_measurement_id || '').trim()
  return GA_MEASUREMENT_ID_PATTERN.test(measurement_id) ? measurement_id : ''
}

export function useGoogleAnalytics() {
  const measurement_id = readMeasurementId()

  function install(): void {
    if (!measurement_id) return

    useServerHead({
      script: [
        {
          key: GA_SCRIPT_KEY,
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurement_id)}`,
          tagPriority: 1
        },
        {
          key: GA_INIT_KEY,
          innerHTML: [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            'gtag(\'js\', new Date());',
            `gtag('config', '${measurement_id}', { send_page_view: false, page_location: window.location.origin + window.location.pathname });`
          ].join('\n'),
          tagPriority: 2
        }
      ]
    })
  }

  function trackPageView(page_view: AnalyticsPageView): void {
    if (!import.meta.client || !measurement_id || typeof window.gtag !== 'function') return

    const page_path = page_view.path
    const current_url = new URL(window.location.href)
    const campaign_query = new URLSearchParams()
    for (const [key, value] of current_url.searchParams) {
      if (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'].includes(key)) campaign_query.set(key, value)
    }
    const page_location = `${window.location.origin}${page_path}${campaign_query.size ? `?${campaign_query}` : ''}`
    const page_title = page_view.title || document.title
    const params: GtagPageViewParams = {
      send_to: measurement_id,
      page_path,
      page_location,
      page_title
    }

    window.gtag('event', 'page_view', params)
  }

  function trackEvent(name: GrowthEventName, params: GrowthEventParams = {}): void {
    if (!import.meta.client || !measurement_id || typeof window.gtag !== 'function') return
    window.gtag('event', name, {
      send_to: measurement_id,
      page_path: window.location.pathname,
      page_location: `${window.location.origin}${window.location.pathname}`,
      ...params
    })
  }

  return {
    measurement_id,
    install,
    trackPageView,
    trackEvent
  }
}
