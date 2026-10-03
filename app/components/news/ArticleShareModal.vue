<script setup lang="ts">
import { computed, ref } from 'vue'
import ArticleShareActions from '~/components/news/ArticleShareActions.vue'
import { withBeansShareAttribution } from '~/utils/outboundUrl'

const props = defineProps<{
  article_title: string
  article_url?: string | null
  article_id?: string
  has_coverage?: boolean
  inline?: boolean
}>()

const is_open = ref(false)
const copy_status = ref('')
const { trackEvent } = useGoogleAnalytics()
const SITE_URL = useRuntimeConfig().public.site_url.replace(/\/+$/, '')
const share_mode = ref(props.has_coverage && props.article_id ? 'coverage' : 'original')
const original_url = computed(() => withBeansShareAttribution(props.article_url))
const coverage_url = computed(() => props.has_coverage && props.article_id ? `${SITE_URL}/articles/${encodeURIComponent(props.article_id)}` : undefined)
const share_url = computed(() => share_mode.value === 'coverage' ? coverage_url.value : original_url.value)
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
    trackShare('copy')
    copy_status.value = 'Link copied.'
  } catch {
    copy_status.value = 'Copy failed. Select the URL above to copy it.'
  }
}

function trackShare(channel: string): void {
  trackEvent(share_mode.value === 'coverage' ? 'share_coverage' : 'share_original', { article_id: props.article_id, channel })
}

function setShareMode(mode: string): void {
  share_mode.value = mode
  copy_status.value = ''
}
</script>

<template>
  <div
    v-if="share_url"
    :class="inline ? 'flex flex-col items-end gap-2' : 'inline-flex items-center'"
  >
    <template v-if="inline">
      <UInput
        v-if="copy_status && copy_status !== 'Link copied.'"
        :model-value="share_url"
        readonly
        aria-label="Share URL"
        class="w-full"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <ArticleShareActions
        :options="share_options"
        align_end
        @copy="copyShareUrl"
        @share="trackShare"
      />
      <p
        v-if="copy_status"
        role="status"
        aria-live="polite"
        class="text-xs text-stone-400"
      >
        {{ copy_status }}
      </p>
    </template>
    <UTooltip
      v-else
      text="Share article"
    >
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
      v-if="!inline"
      v-model:open="is_open"
      title="Share article"
      :ui="{ content: 'sm:max-w-md' }"
      @update:open="copy_status = ''"
    >
      <template #body>
        <div class="space-y-4">
          <div
            v-if="coverage_url && original_url"
            class="flex flex-wrap gap-2"
          >
            <UButton
              label="Share Beans coverage"
              :variant="share_mode === 'coverage' ? 'soft' : 'ghost'"
              :aria-pressed="share_mode === 'coverage'"
              size="sm"
              @click="setShareMode('coverage')"
            />
            <UButton
              label="Share original article"
              color="neutral"
              :variant="share_mode === 'original' ? 'soft' : 'ghost'"
              :aria-pressed="share_mode === 'original'"
              size="sm"
              @click="setShareMode('original')"
            />
          </div>
          <p class="text-xs text-stone-400">
            {{ share_mode === 'coverage' ? 'Share the source comparison on Beans.' : 'Share the original publisher’s article.' }}
          </p>
          <UInput
            :model-value="share_url"
            readonly
            aria-label="Share URL"
            class="w-full"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <ArticleShareActions
            :options="share_options"
            @copy="copyShareUrl"
            @share="trackShare"
          />
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
