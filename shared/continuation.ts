export type ContinuationState = 'available' | 'loading' | 'retryable_error' | 'sign_in_required' | 'exhausted' | 'authenticated_available'
export interface ContinuationAccess { state: ContinuationState, token?: string, expires_at?: number }
export interface ContinuationInput { continuation_token?: string, expires_at?: number }
export interface ContinuationResult { continuation_access?: ContinuationAccess }
export interface ContinuationContext {
  surface: 'home' | 'category' | 'source' | 'search' | 'related'
  context: string
  criteria: Record<string, unknown>
}
