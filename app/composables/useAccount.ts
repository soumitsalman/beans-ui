import type { AccountSession } from '#shared/account'
import { safeReturnPath } from '#shared/account'

export function useAccount() {
  const session = useState<AccountSession>('beans-account', () => ({ signed_in: false, preference: null, error_message: null }))
  const clear_requested = useState('beans-clear-preferences', () => false)
  const editor_open = useState('beans-preference-editor', () => false)
  const draft_dirty = useState('beans-preference-dirty', () => false)
  const pending_action = useState<'preferences' | 'account' | 'keys' | null>('beans-account-action', () => null)
  const offer_setup = useState('beans-offer-preferences', () => false)
  const auth_mode = useState<'sign_in' | 'sign_up'>('beans-auth-mode', () => 'sign_in')
  const return_path = useState('beans-auth-return', () => '/')
  const account_open = useState('beans-account-open', () => false)
  const auth_open = useState('beans-auth-open', () => false)
  const refresh_generation = useState('beans-session-request-generation', () => 0)
  const generation = useState('beans-account-generation', () => 0)
  const signed_out_revision = useState('beans-signed-out-revision', () => 0)
  const preference_revision = useState('beans-preference-revision', () => 0)
  const account_message = useState<string | null>('beans-account-message', () => null)
  const clerk = useClerk()
  const route = useRoute()
  const request_fetch = useRequestFetch()
  function hidePrivateControls(): void {
    account_open.value = false
    offer_setup.value = false
    if (draft_dirty.value) pending_action.value = 'preferences'
    editor_open.value = false
  }
  async function refreshSession(): Promise<void> {
    const current = ++refresh_generation.value
    try {
      const result = await request_fetch<AccountSession>('/api/account/session', { retry: 0, timeout: 10000 })
      if (current !== refresh_generation.value)
        return
      const previous = session.value
      if (previous.signed_in && !result.signed_in) {
        generation.value++
        hidePrivateControls()
      }
      session.value = result
      if (previous.signed_in && result.signed_in && JSON.stringify(previous.preference) !== JSON.stringify(result.preference))
        preference_revision.value++
    } catch {
      if (current === refresh_generation.value) {
        generation.value++
        hidePrivateControls()
        session.value = { signed_in: false, preference: null, error_message: 'Your session could not be verified. You can continue reading; sign in again for account actions.' }
      }
    }
  }
  function openAuth(create_account = false, action: typeof pending_action.value = null): void {
    if (auth_open.value)
      return
    if (!clerk.value?.loaded) {
      account_message.value = 'Sign-in is still loading. Please try again.'
      return
    }
    pending_action.value = action ?? (draft_dirty.value ? 'preferences' : null)
    account_message.value = null
    auth_open.value = true
    return_path.value = safeReturnPath(route.fullPath)
    auth_mode.value = create_account ? 'sign_up' : 'sign_in'
  }
  function openPreferences(): void {
    if (!session.value.signed_in)
      return openAuth(false, 'preferences')
    offer_setup.value = false
    editor_open.value = true
  }
  function openClearPreferences(): void {
    if (!session.value.signed_in) return openAuth(false, 'preferences')
    clear_requested.value = true
  }
  function openAccount(): void {
    if (!session.value.signed_in)
      return openAuth(false, 'account')
    account_open.value = true
  }
  function openKeys(): void {
    if (!session.value.signed_in)
      return openAuth(false, 'keys')
    if (import.meta.client)
      window.open('https://developer.cafecito.tech', '_blank', 'noopener,noreferrer')
  }
  async function signOut(): Promise<void> {
    if (draft_dirty.value)
      return
    if (!clerk.value?.loaded) {
      account_message.value = 'Sign out is still loading. Please try again.'
      return
    }
    try {
      const public_page = ['/', '/search', '/about-beans', '/methodology'].includes(route.path) || /^\/(categories|stories|sources)\/[^/]+\/?$/.test(route.path)
      await clerk.value?.signOut({ redirectUrl: public_page ? safeReturnPath(route.fullPath) : '/' })
      session.value = { signed_in: false, preference: null, error_message: null }
      generation.value++
      signed_out_revision.value++
      editor_open.value = false
      account_open.value = false
      offer_setup.value = false
      pending_action.value = null
      clearNuxtData(key => key.startsWith('feed:') || key.startsWith('search:') || key.startsWith('story:'))
    } catch {
      account_message.value = 'Sign out did not complete. Please retry.'
    }
  }
  return { clear_requested, openClearPreferences, signed_out_revision, auth_mode, return_path, account_open, session, editor_open, draft_dirty, pending_action, offer_setup, auth_open, generation, preference_revision, account_message, refreshSession, openAuth, openPreferences, openAccount, openKeys, signOut }
}
