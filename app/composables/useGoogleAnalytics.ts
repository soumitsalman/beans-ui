import type { AnalyticsPageView, GtagPageViewParams } from '~/types/analytics'

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
            "gtag('js', new Date());",
            `gtag('config', '${measurement_id}', { send_page_view: false });`
          ].join('\n'),
          tagPriority: 2
        }
      ]
    })
  }

  function trackPageView(page_view: AnalyticsPageView): void {
    if (!import.meta.client || !measurement_id || typeof window.gtag !== 'function') return

    const page_path = page_view.path
    const page_location = `${window.location.origin}${page_path}`
    const page_title = page_view.title || document.title
    const params: GtagPageViewParams = {
      send_to: measurement_id,
      page_path,
      page_location,
      page_title
    }

    window.gtag('event', 'page_view', params)
  }

  return {
    measurement_id,
    install,
    trackPageView
  }
}
