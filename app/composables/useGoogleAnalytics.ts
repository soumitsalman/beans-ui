import type { AnalyticsPageView, GtagConfigParams, GtagPageViewParams } from '~/types/analytics'

const GA_SCRIPT_KEY = 'gtag-js'

function readMeasurementId(): string {
  return String(useRuntimeConfig().public.ga_measurement_id || '').trim()
}

function gtag(...args: unknown[]): void {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

export function useGoogleAnalytics() {
  const measurement_id = readMeasurementId()

  function install(): void {
    if (!measurement_id) return

    useHead({
      script: [
        {
          key: GA_SCRIPT_KEY,
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurement_id)}`
        }
      ]
    })

    if (!import.meta.client) return

    window.dataLayer = window.dataLayer || []
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', measurement_id, { send_page_view: false } satisfies GtagConfigParams)
  }

  function trackPageView(page_view: AnalyticsPageView): void {
    if (!import.meta.client || !measurement_id || !window.gtag) return

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
