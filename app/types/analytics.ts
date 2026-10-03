export interface AnalyticsPageView {
  path: string
  title?: string
}

export interface AnalyticsPageMetadata {
  path: string
  title: string
}

export type GrowthEventName = 'coverage_open' | 'share_coverage' | 'share_original' | 'search_submit' | 'publisher_click' | 'web_vitals'
export type GrowthEventParams = Record<string, string | number | boolean | undefined>

export interface GtagPageViewParams {
  send_to: string
  page_path: string
  page_location: string
  page_title: string
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
