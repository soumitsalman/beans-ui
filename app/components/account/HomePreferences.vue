<script setup lang="ts">
const { session, openPreferences, openClearPreferences, refreshSession } = useAccount()
defineProps<{ personalized?: boolean }>()
const summary = computed(() => {
  const preference = session.value.preference
  if (!preference) return ''
  return [preference.topic, preference.tags.join(', '), preference.domains.length ? `Sources: ${preference.domains.join(', ')}` : '', preference.exclude_domains.length ? `Exclude: ${preference.exclude_domains.join(', ')}` : '', preference.languages.join(', ')].filter(Boolean).join(' · ')
})
</script>

<template>
  <UAlert
    v-if="session.signed_in"
    icon="lucide:sliders-horizontal"
    color="neutral"
    variant="subtle"
    :title="session.error_message ? 'Preferences unavailable' : personalized ? 'Following your preferences' : session.preference ? 'Your Home preferences' : 'Make Home yours'"
    :description="session.error_message || summary || 'Set preferences for your signed-in Home feed. Categories stay the same.'"
    :ui="{ description: 'break-words' }"
  >
    <template #actions>
      <UButton
        v-if="session.error_message"
        label="Retry preferences"
        color="neutral"
        variant="outline"
        @click="refreshSession"
      />
      <UButton
        :label="session.preference ? 'Edit' : 'Set preferences'"
        color="neutral"
        variant="outline"
        @click="openPreferences"
      />
      <UButton
        v-if="session.preference"
        label="Clear"
        color="neutral"
        variant="ghost"
        @click="openClearPreferences"
      />
    </template>
  </UAlert>
</template>
