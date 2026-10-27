<script setup lang="ts">
const { openAuth } = useAccount()
</script>

<template>
  <UAlert
    icon="lucide:lock-keyhole"
    color="primary"
    variant="subtle"
    title="Sign in for more content"
    description="Your stories stay visible. Sign in to load more."
    aria-live="polite"
    :ui="{ root: 'beans-surface border border-primary/30', actions: 'flex-wrap' }"
  >
    <template #actions>
      <UButton
        label="Sign in"
        @click="openAuth()"
      /><UButton
        label="Create account"
        variant="outline"
        @click="openAuth(true)"
      />
    </template>
  </UAlert>
</template>
