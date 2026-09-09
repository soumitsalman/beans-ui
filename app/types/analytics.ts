export interface AnalyticsPageView {
  path: string
  title?: string
}

export interface GtagPageViewParams {
  send_to: string
  page_path: string
  page_location: string
  page_title: string
}

export interface GtagConfigParams {
  send_page_view: boolean
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
