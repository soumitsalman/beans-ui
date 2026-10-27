<script setup lang="ts">
import PreferenceEditor from './PreferenceEditor.vue'
import { ACCOUNT_AUTH_APPEARANCE, ACCOUNT_PROFILE_APPEARANCE } from '~/settings/account'
import { onMounted, onScopeDispose, watch } from 'vue'

const account = useAccount()
const { session, draft_dirty, account_message, offer_setup } = account
const { user, isLoaded } = useUser()
const route = useRoute()
const router = useRouter()
const signing_out = ref(false)
const confirm_signout = ref(false)
const items = computed(() => [
  [{ label: 'Account', icon: 'lucide:user-round', onSelect: () => account.openAccount() }, { label: 'Preferences', icon: 'lucide:sliders-horizontal', onSelect: () => account.openPreferences() }, { label: 'API keys', icon: 'lucide:key-round', onSelect: () => account.openKeys() }],
  [{ label: 'Sign out', icon: 'lucide:log-out', onSelect: () => draft_dirty.value ? confirm_signout.value = true : doSignOut() }]
])
let _identity: string | null | undefined
let _last_signed_in_identity: string | undefined
let _stop: (() => void) | undefined
let _channel: BroadcastChannel | undefined
async function doSignOut() {
  if (signing_out.value)
    return
  signing_out.value = true
  try {
    await account.signOut()
  } finally {
    signing_out.value = false
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (draft_dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
function onFocus() {
  if (!draft_dirty.value)
    void account.refreshSession()
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  window.addEventListener('focus', onFocus)
  _channel = new BroadcastChannel('beans-account')
  _channel.onmessage = () => {
    if (!draft_dirty.value)
      void account.refreshSession()
  }
  _stop = watch([isLoaded, () => user.value?.id], async () => {
    if (!isLoaded.value)
      return
    const identity = user.value?.id ?? null
    const previous = _identity
    const changed_owner = Boolean(identity && _last_signed_in_identity && identity !== _last_signed_in_identity)
    if (identity) _last_signed_in_identity = identity
    _identity = identity
    if (identity === previous)
      return
    // Remove another identity's private state before any asynchronous work.
    if (previous !== undefined || !identity) {
      account.generation.value++
      session.value = { signed_in: false, preference: null, error_message: null }
      if (changed_owner) account.signed_out_revision.value++
      if (draft_dirty.value && !changed_owner) account.pending_action.value = 'preferences'
      account.editor_open.value = false
      account.account_open.value = false
      offer_setup.value = false
      if (changed_owner) draft_dirty.value = false
      clearNuxtData(key => /^(feed|search|story):/.test(key))
    }
    await account.refreshSession()
    if (!session.value.signed_in)
      return
    const action = account.pending_action.value
    account.pending_action.value = null
    account.auth_open.value = false
    if (action === 'preferences')
      account.openPreferences()
    if (action === 'account')
      account.openAccount()
    if (action === 'keys')
      account_message.value = 'You are signed in. Open API keys from the account menu to continue.'
    const created = user.value?.createdAt?.getTime() ?? 0
    const last_sign_in = user.value?.lastSignInAt?.getTime() ?? 0
    if (!session.value.preference && created && Math.abs(last_sign_in - created) < 60000 && !sessionStorage.getItem(`beans-setup-offered:${identity}`)) {
      offer_setup.value = true
      sessionStorage.setItem(`beans-setup-offered:${identity}`, 'true')
    }
  }, { immediate: true })
})
watch(() => account.preference_revision.value, () => _channel?.postMessage('preference_changed'))
watch(() => account.auth_open.value, (open) => {
  if (!open) {
    account.pending_action.value = null
    if (route.path === account.return_path.value.split(/[?#]/)[0])
      void router.replace(account.return_path.value)
  }
})
onScopeDispose(() => {
  _stop?.()
  _channel?.close()
  if (import.meta.client) {
    window.removeEventListener('beforeunload', beforeUnload)
    window.removeEventListener('focus', onFocus)
  }
})
</script>

<template>
  <UDropdownMenu
    v-if="session.signed_in"
    :items="items"
    :content="{ align: 'end' }"
  >
    <UButton
      icon="lucide:circle-user-round"
      color="neutral"
      variant="ghost"
      square
      :loading="signing_out"
      :aria-label="user?.firstName ? `Account for ${user.firstName}` : 'Your account'"
    />
  </UDropdownMenu>
  <UTooltip
    v-else
    text="Sign in"
  >
    <UButton
      icon="lucide:circle-user-round"
      color="neutral"
      variant="ghost"
      square
      aria-label="Sign in"
      @click="account.openAuth()"
    />
  </UTooltip>
  <UModal
    v-model:open="confirm_signout"
    title="Unsaved preferences"
    description="Choose whether to keep editing or discard your changes before signing out."
  >
    <template #body>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Continue editing"
          @click="confirm_signout = false; account.editor_open.value = true"
        />
        <UButton
          label="Discard and sign out"
          color="warning"
          @click="draft_dirty = false; confirm_signout = false; doSignOut()"
        />
        <UButton
          label="Cancel sign out"
          color="neutral"
          variant="ghost"
          @click="confirm_signout = false"
        />
      </div>
    </template>
  </UModal>
  <UModal
    :open="Boolean(account_message)"
    title="Account"
    :description="account_message || undefined"
    @update:open="value => { if (!value) account_message = null }"
  >
    <template #body>
      <UButton
        label="Close"
        @click="account_message = null"
      />
    </template>
  </UModal>
  <UModal
    :open="offer_setup && !account.editor_open.value && !account.pending_action.value && !account.account_open.value && !account_message"
    title="Make Home yours"
    description="Set preferences for your Home feed, or continue with the standard feed."
    @update:open="value => { if (!value) offer_setup = false }"
  >
    <template #body>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Set preferences"
          @click="account.openPreferences()"
        /><UButton
          label="Not now"
          color="neutral"
          variant="ghost"
          @click="offer_setup = false"
        />
      </div>
    </template>
  </UModal>
  <PreferenceEditor />
  <UModal
    v-model:open="account.auth_open.value"
    :title="account.auth_mode.value === 'sign_up' ? 'Create account' : 'Sign in'"
    description="Keep your reading context while signing in."
    :ui="{ content: 'max-w-lg', body: 'overflow-x-hidden px-2 sm:px-4' }"
  >
    <template #body>
      <ClientOnly>
        <SignUp
          v-if="account.auth_mode.value === 'sign_up'"
          routing="hash"
          :force-redirect-url="account.return_path.value"
          :appearance="ACCOUNT_AUTH_APPEARANCE"
        />
        <SignIn
          v-else
          routing="hash"
          :force-redirect-url="account.return_path.value"
          :appearance="ACCOUNT_AUTH_APPEARANCE"
        />
        <template #fallback>
          <UAlert title="Loading sign-in…" />
        </template>
      </ClientOnly>
      <UButton
        :label="account.auth_mode.value === 'sign_up' ? 'Already have an account? Sign in' : 'Create account'"
        variant="ghost"
        @click="account.auth_mode.value = account.auth_mode.value === 'sign_up' ? 'sign_in' : 'sign_up'"
      />
    </template>
  </UModal>
  <UModal
    v-model:open="account.account_open.value"
    title="Your account"
    description="Manage your Clerk account. Deleting it ends account access and removes your Beans preferences; local cleanup may finish asynchronously. Zuplo API keys and portal access must be managed separately."
    :ui="{ content: 'max-w-3xl', body: 'overflow-x-hidden' }"
  >
    <template #body>
      <UAlert
        v-if="!isLoaded"
        title="Account management is still loading. Close this dialog and retry if it does not appear."
        color="warning"
      />
      <ClientOnly>
        <UserProfile
          routing="hash"
          :appearance="ACCOUNT_PROFILE_APPEARANCE"
        />
      </ClientOnly>
      <UButton
        to="https://developer.cafecito.tech"
        external
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        label="Manage Zuplo access separately"
      />
    </template>
  </UModal>
</template>
