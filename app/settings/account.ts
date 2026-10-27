import type { ClerkAppearanceTheme } from '@clerk/nuxt/types'

export const ACCOUNT_AUTH_APPEARANCE: ClerkAppearanceTheme = {
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', maxWidth: '100%', boxShadow: 'none' },
    card: { width: '100%', maxWidth: '100%' },
    footerAction: { display: 'none' }
  }
}
export const ACCOUNT_PROFILE_APPEARANCE: ClerkAppearanceTheme = {
  elements: { rootBox: { width: '100%' }, cardBox: { width: '100%', maxWidth: '100%', boxShadow: 'none' } }
}
