<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

interface MarkdownSummaryProps {
  summary: string
  line_limit: 2 | 3
}

const MARKDOWN_RENDERER = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true
}).disable('image')
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\([^)]*\)/g

const props = defineProps<MarkdownSummaryProps>()

const prepared_summary = computed(() => props.summary.replace(MARKDOWN_IMAGE_PATTERN, ' ').replace(/\s+/g, ' ').trim())
const rendered_summary = computed(() => MARKDOWN_RENDERER.renderInline(prepared_summary.value))
const summary_class = computed(() => props.line_limit === 3
  ? 'line-clamp-3 leading-6 text-stone-300'
  : 'line-clamp-2 leading-5 text-stone-400'
)
</script>

<template>
  <!-- markdown-it is configured with html:false, so API-supplied HTML is escaped. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    :class="[
      'text-sm [&_a]:font-medium [&_a]:text-amber-300 [&_a]:underline [&_a]:decoration-amber-300/40 [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-stone-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-stone-300',
      summary_class
    ]"
    v-html="rendered_summary"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
