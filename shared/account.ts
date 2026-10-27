import type { UserPreference } from './userPreferences'

export interface AccountSession {
  signed_in: boolean
  preference: UserPreference | null
  error_message: string | null
}
export function safeReturnPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value))
    return '/'
  try {
    const url = new URL(value, 'https://beans.invalid')
    return url.origin === 'https://beans.invalid' ? `${url.pathname}${url.search}${url.hash}` : '/'
  } catch {
    return '/'
  }
}
