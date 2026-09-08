export type TelemetryEventName = 'page_view' | 'content_load'
export type TelemetrySurface = 'home' | 'category' | 'search' | 'story'
export type TelemetryFeed = 'top_headlines' | 'latest_news' | 'search_results' | 'story_coverage'
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
