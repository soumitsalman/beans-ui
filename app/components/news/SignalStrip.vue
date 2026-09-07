<script setup lang="ts">
import type { EspressoSignal } from '~/types/news'
import { formatTaxonomyLabel } from '~/utils/formatters'

defineProps<{
  signals: EspressoSignal[]
  loading: boolean
}>()

function signalLabel(signal: EspressoSignal): string {
  return formatTaxonomyLabel(signal.impact_level || signal.categories?.[0]) || 'Signal'
}

function confidenceLabel(confidence?: number | null): string | null {
  if (typeof confidence !== 'number') return null

  return `${Math.round(confidence * 100)}% confidence`
}
</script>

<template>
  <section
    class="space-y-3"
    aria-labelledby="analysis-heading"
  >
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
          Espresso
        </p>
        <h2
          id="analysis-heading"
          class="mt-1 text-lg font-semibold text-stone-100"
        >
          Market signals
        </h2>
      </div>
      <UIcon
        name="lucide:activity"
        class="size-5 text-primary/80"
        aria-hidden="true"
      />
    </div>

    <div class="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <USkeleton
        v-for="index in loading ? 3 : 0"
        :key="index"
        class="h-28 w-64 shrink-0 rounded-lg"
      />
      <article
        v-for="signal in signals"
        :key="signal.id || signal.summary"
        class="w-72 shrink-0 rounded-lg border border-stone-800 bg-stone-900/70 p-4"
      >
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="truncate font-medium text-primary">{{ signalLabel(signal) }}</span>
          <span
            v-if="confidenceLabel(signal.confidence)"
            class="shrink-0 text-stone-500"
          >
            {{ confidenceLabel(signal.confidence) }}
          </span>
        </div>
        <p class="mt-3 line-clamp-3 text-sm leading-5 text-stone-300">
          {{ signal.summary || 'No summary is available for this signal.' }}
        </p>
      </article>
    </div>
  </section>
</template>
