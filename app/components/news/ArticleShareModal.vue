<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBeansShareAttribution } from '~/utils/outboundUrl'

const props = defineProps<{
  article_title: string
  article_url?: string | null
}>()

const is_open = ref(false)
const copy_status = ref('')
const share_url = computed(() => withBeansShareAttribution(props.article_url))
const share_options = computed(() => {
  if (!share_url.value) return []
  const url = share_url.value
  return [
    { label: 'X', icon: 'simple-icons:x', href: shareHref('https://twitter.com/intent/tweet', { url, text: props.article_title }) },
    { label: 'LinkedIn', icon: 'simple-icons:linkedin', href: shareHref('https://www.linkedin.com/sharing/share-offsite/', { url }) },
    { label: 'Reddit', icon: 'simple-icons:reddit', href: shareHref('https://www.reddit.com/submit', { url, title: props.article_title, type: 'LINK' }) },
    { label: 'Threads', icon: 'simple-icons:threads', href: shareHref('https://www.threads.com/intent/post', { text: `${props.article_title}\n${url}` }) },
    { label: 'Email', icon: 'lucide:mail', href: `mailto:?${new URLSearchParams({ subject: props.article_title, body: `${props.article_title}\n${url}` })}` }
  ]
})

function shareHref(base_url: string, params: Record<string, string>): string {
  const url = new URL(base_url)
  url.search = new URLSearchParams(params).toString()
  return url.toString()
}

async function copyShareUrl(): Promise<void> {
  copy_status.value = ''
  if (!share_url.value || !import.meta.client || !navigator.clipboard?.writeText) {
    copy_status.value = 'Copy is unavailable. Select the URL above to copy it.'
    return
  }

  try {
    await navigator.clipboard.writeText(share_url.value)
    copy_status.value = 'Link copied.'
  } catch {
    copy_status.value = 'Copy failed. Select the URL above to copy it.'
  }
}
</script>

<template>
  <div
    v-if="share_url"
    class="inline-flex items-center"
  >
    <UTooltip text="Share article">
      <UButton
        icon="lucide:share-2"
        color="neutral"
        variant="soft"
        class="ml-1 rounded-full p-1.5"
        :ui="{ leadingIcon: 'size-3' }"
        aria-label="Share article"
        @click="is_open = true"
      />
    </UTooltip>
    <UModal
      v-model:open="is_open"
      title="Share article"
      :ui="{ content: 'sm:max-w-md' }"
      @update:open="copy_status = ''"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            :model-value="share_url"
            readonly
            aria-label="Share URL with Beans attribution"
            class="w-full"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <div class="flex flex-nowrap items-center justify-center gap-2">
            <UTooltip text="Copy link">
              <UButton
                icon="lucide:copy"
                color="neutral"
                variant="outline"
                class="size-8 shrink-0 justify-center rounded-full p-0"
                :ui="{ leadingIcon: 'size-4' }"
                aria-label="Copy link"
                @click="copyShareUrl"
              />
            </UTooltip>
            <UTooltip
              v-for="option in share_options"
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
                class="size-8 shrink-0 justify-center rounded-full p-0"
                :ui="{ leadingIcon: 'size-4' }"
                :aria-label="option.label"
              />
            </UTooltip>
          </div>
          <p
            v-if="copy_status"
            role="status"
            aria-live="polite"
            class="text-xs text-stone-400"
          >
            {{ copy_status }}
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>
