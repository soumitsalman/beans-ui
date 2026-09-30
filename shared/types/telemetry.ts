export type TelemetryEventName = 'page_view' | 'content_load'
export type TelemetrySurface = 'home' | 'category' | 'search' | 'article' | 'source'
export type TelemetryFeed = 'article_feed' | 'source_latest' | 'search_results' | 'article_coverage' | 'article_related'
export type TelemetryAction = 'initial' | 'more'
export type TelemetryOutcome = 'success' | 'error'

export interface ClientTelemetryEvent {
  event: TelemetryEventName
  path: string
  from_path?: string
  surface?: TelemetrySurface
  feed?: TelemetryFeed
  action?: TelemetryAction
  outcome?: TelemetryOutcome
  cursor_present?: boolean
  requested_count?: number
  received_count?: number
  visible_count?: number
}
