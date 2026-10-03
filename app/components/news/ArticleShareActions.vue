<script setup lang="ts">
defineProps<{
  options: { label: string, icon: string, href: string }[]
  align_end?: boolean
}>()
const emit = defineEmits<{
  copy: []
  share: [channel: string]
}>()
</script>

<template>
  <div :class="['flex flex-wrap items-center gap-2', align_end ? 'justify-end' : 'justify-center']">
    <UTooltip text="Copy link">
      <UButton
        icon="lucide:copy"
        color="neutral"
        variant="outline"
        class="size-8 shrink-0 justify-center rounded-full p-0 text-[#ccc] hover:text-[#ddd]"
        :ui="{ leadingIcon: 'size-4' }"
        aria-label="Copy link"
        @click="emit('copy')"
      />
    </UTooltip>
    <UTooltip
      v-for="option in options"
      :key="option.label"
      :text="option.label"
    >
      <UButton
        :to="option.href"
        target="_blank"
        rel="noopener noreferrer"
        :icon="option.icon"
        color="neutral"
        variant="outline"
        class="size-8 shrink-0 justify-center rounded-full p-0 text-[#ccc] hover:text-[#ddd]"
        :ui="{ leadingIcon: 'size-4' }"
        :aria-label="option.label"
        @click="emit('share', option.label)"
      />
    </UTooltip>
  </div>
</template>
