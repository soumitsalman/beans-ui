<script setup lang="ts">
import { EMPTY_PREFERENCE, PREFERENCE_FIELDS, PREFERENCE_SCHEMA, normalisePreferences } from '#shared/userPreferences'
import type { PreferenceDraft, UserPreference } from '#shared/userPreferences'

const account = useAccount()
const { session, editor_open, draft_dirty } = account
const router = useRouter()
const { user } = useUser()
const draft = reactive<PreferenceDraft>({ ...EMPTY_PREFERENCE })
const saving = ref(false)
const clearing = ref(false)
const confirm_clear = ref(false)
const confirm_discard = ref(false)
const error_message = ref<string | null>(null)
const success_message = ref<string | null>(null)
const version = ref(0)
let _baseline = JSON.stringify(draft)
let _draft_owner: string | undefined
let _discard_action: (() => void) | undefined
let _remove_guard: (() => void) | undefined
const normalized = computed(() => normalisePreferences(draft))
const validation = computed(() => PREFERENCE_SCHEMA.safeParse(normalized.value))
const field_errors = computed(() => validation.value.success ? {} : validation.value.error.flatten().fieldErrors)
const modal_open = computed({ get: () => editor_open.value, set: (value: boolean) => value ? editor_open.value = true : closeEditor() })
function loadSaved() {
  const preference = session.value.preference
  Object.assign(draft, preference ? { topic: preference.topic, tags: preference.tags.join(', '), domains: preference.domains.join(', '), exclude_domains: preference.exclude_domains.join(', '), languages: preference.languages.join(', ') } : EMPTY_PREFERENCE)
  version.value = preference?.version ?? 0
  _baseline = JSON.stringify(draft)
  draft_dirty.value = false
  _draft_owner = user.value?.id
}
watch(draft, () => {
  draft_dirty.value = JSON.stringify(draft) !== _baseline
})
watch(editor_open, (open) => {
  if (!open)
    return
  if (!draft_dirty.value || _draft_owner !== user.value?.id)
    loadSaved()
  error_message.value = session.value.error_message
  success_message.value = null
})
watch(account.clear_requested, (requested) => {
  if (!requested) return
  loadSaved()
  confirm_clear.value = true
  account.clear_requested.value = false
})
function discardThen(action: () => void) {
  if (saving.value || clearing.value)
    return
  if (!draft_dirty.value)
    return action()
  _discard_action = action
  confirm_discard.value = true
}
function closeEditor() {
  discardThen(() => {
    editor_open.value = false
    account.offer_setup.value = false
  })
}
function failure(error: unknown, fallback: string) {
  const response = error as {
    statusCode?: number
    data?: {
      statusCode?: number
      statusMessage?: string
    }
  }
  error_message.value = response.data?.statusMessage || fallback
  if ((response.statusCode || response.data?.statusCode) === 401) {
    error_message.value = 'Your session expired. Your draft is retained. Sign in, then review and save again.'
  }
}
async function savePreferences() {
  if (!validation.value.success || saving.value || clearing.value || session.value.error_message)
    return
  const generation = account.generation.value
  saving.value = true
  error_message.value = null
  try {
    const result = await $fetch<{
      preference: UserPreference
    }>('/api/account/preferences', { method: 'POST', body: { preference: validation.value.data, version: version.value }, retry: 0, timeout: 10000 })
    if (generation !== account.generation.value || !session.value.signed_in)
      return
    session.value.preference = result.preference
    loadSaved()
    account.preference_revision.value++
    success_message.value = 'Preferences saved. Your Home feed will use these filters.'
    editor_open.value = false
    account.account_message.value = success_message.value
    account.offer_setup.value = false
  } catch (error) {
    failure(error, 'Saving was not confirmed. Your draft is retained. Reload the saved version before trying again.')
  } finally {
    saving.value = false
  }
}
async function clearPreferences() {
  if (clearing.value || saving.value || !session.value.preference)
    return
  const generation = account.generation.value
  clearing.value = true
  error_message.value = null
  try {
    await $fetch('/api/account/preferences', { method: 'DELETE', body: { version: version.value }, retry: 0, timeout: 10000 })
    if (generation !== account.generation.value || !session.value.signed_in)
      return
    session.value.preference = null
    loadSaved()
    account.preference_revision.value++
    confirm_clear.value = false
    editor_open.value = false
    account.account_message.value = 'Preferences cleared. Home now uses the standard discovery feed.'
  } catch (error) {
    failure(error, 'Clearing was not confirmed. Reload the saved version to check its current state before trying again.')
  } finally {
    clearing.value = false
  }
}
async function reloadSaved() {
  discardThen(() => {
    void account.refreshSession().then(() => {
      if (session.value.error_message) error_message.value = session.value.error_message
      else {
        loadSaved()
        error_message.value = null
      }
    })
  })
}
onMounted(() => {
  _remove_guard = router.beforeEach((to, from) => {
    if ((to.path === from.path && JSON.stringify(to.query) === JSON.stringify(from.query)) || !draft_dirty.value || !editor_open.value)
      return
    discardThen(() => {
      draft_dirty.value = false
      editor_open.value = false
      void router.push(to.fullPath)
    })
    return false
  })
})
onScopeDispose(() => _remove_guard?.())
</script>

<template>
  <UModal
    v-model:open="modal_open"
    title="Set your preferences"
    description="Shape your Home feed. Categories stay the same."
    :dismissible="!saving && !clearing"
    :close="!saving && !clearing"
    :ui="{ content: 'max-w-2xl', body: 'max-h-[70dvh] overflow-y-auto' }"
  >
    <template #body>
      <UForm
        :state="draft"
        class="space-y-5"
        @submit="savePreferences"
      >
        <UAlert
          v-if="error_message"
          color="warning"
          :title="error_message"
          aria-live="polite"
        >
          <template #actions>
            <UButton
              label="Reload saved version"
              variant="outline"
              color="neutral"
              :disabled="saving || clearing"
              @click="reloadSaved"
            />
            <UButton
              label="Sign in again"
              variant="outline"
              color="neutral"
              @click="account.openAuth(false, 'preferences')"
            />
          </template>
        </UAlert>
        <UFormField
          v-for="field in PREFERENCE_FIELDS"
          :key="field.name"
          :name="field.name"
          :label="field.label"
          :description="field.help"
          :error="draft_dirty ? field_errors[field.name]?.[0] : undefined"
        >
          <UInput
            v-model="draft[field.name]"
            class="w-full"
            size="lg"
            :placeholder="field.placeholder"
            :disabled="saving || clearing"
            :maxlength="field.name === 'topic' ? 500 : 16000"
            autocomplete="off"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Save preferences"
            type="submit"
            size="lg"
            :loading="saving"
            :disabled="!validation.success || clearing || Boolean(session.error_message)"
          />
          <UButton
            v-if="session.preference"
            label="Clear preferences"
            color="warning"
            variant="outline"
            :disabled="saving || clearing"
            @click="confirm_clear = true"
          />
          <UButton
            :label="session.preference ? 'Cancel' : 'Not now'"
            color="neutral"
            variant="ghost"
            :disabled="saving || clearing"
            @click="closeEditor"
          />
        </div>
      </UForm>
    </template>
  </UModal>
  <UModal
    v-model:open="confirm_clear"
    title="Clear preferences?"
    description="Your Home feed will return to standard discovery. Your account and category feeds stay available."
    :dismissible="!clearing"
  >
    <template #body>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Clear preferences"
          color="warning"
          :loading="clearing"
          @click="clearPreferences"
        /><UButton
          label="Keep preferences"
          color="neutral"
          variant="ghost"
          :disabled="clearing"
          @click="confirm_clear = false"
        />
      </div>
    </template>
  </UModal>
  <UModal
    v-model:open="confirm_discard"
    title="Discard unsaved changes?"
    description="Your saved preference will remain active."
  >
    <template #body>
      <div class="flex flex-wrap gap-2">
        <UButton
          label="Continue editing"
          @click="confirm_discard = false"
        /><UButton
          label="Discard changes"
          color="warning"
          @click="draft_dirty = false; confirm_discard = false; _discard_action?.()"
        />
      </div>
    </template>
  </UModal>
</template>
