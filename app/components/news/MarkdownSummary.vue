<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { withOutboundReferral } from '~/utils/outboundUrl'

interface MarkdownSummaryProps {
  summary: string
  line_limit: 2 | 3
  on_image?: boolean
}

interface MarkdownRenderEnv {
  site_origin?: string
}

const MARKDOWN_RENDERER = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true
}).disable('image')
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\([^)]*\)/g

MARKDOWN_RENDERER.renderer.rules.link_open = (tokens, idx, options, env: MarkdownRenderEnv, self) => {
  const token = tokens[idx]
  if (!token) return self.renderToken(tokens, idx, options)

  const referred_href = withOutboundReferral(token.attrGet('href'), env.site_origin)
  if (referred_href) token.attrSet('href', referred_href)
  return self.renderToken(tokens, idx, options)
}

const props = defineProps<MarkdownSummaryProps>()
const runtime_config = useRuntimeConfig()
const SITE_ORIGIN = String(runtime_config.public.site_url || '')

const prepared_summary = computed(() => props.summary.replace(MARKDOWN_IMAGE_PATTERN, ' ').replace(/\s+/g, ' ').trim())
const rendered_summary = computed(() => MARKDOWN_RENDERER.renderInline(prepared_summary.value, {
  site_origin: SITE_ORIGIN
}))
const summary_class = computed(() => [
  props.line_limit === 3 ? 'line-clamp-3 leading-6' : 'line-clamp-2 leading-5',
  props.on_image
    ? 'text-stone-100 [&_a]:text-stone-100 [&_a]:decoration-stone-300/70'
    : `${props.line_limit === 3 ? 'text-stone-300' : 'text-stone-400'} [&_a]:text-primary [&_a]:decoration-primary/40`
])
</script>

<template>
  <!-- markdown-it is configured with html:false, so API-supplied HTML is escaped. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    :class="[
      'text-sm [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-stone-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-stone-300',
      summary_class
    ]"
    v-html="rendered_summary"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
