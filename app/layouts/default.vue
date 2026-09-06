<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_GROUPS } from '~/settings/categories'

const route = useRoute()
const navigation_items = computed(() => [
  { label: 'Now', to: '/' },
  ...CATEGORY_GROUPS.map(category => ({
    label: category.label,
    to: `/category/${category.slug}`
  }))
])

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-stone-100">
    <header class="sticky top-0 z-30 border-b border-stone-800/90 bg-stone-950/95 backdrop-blur">
      <div class="mx-auto flex h-15 max-w-6xl items-center justify-between px-4 sm:px-6">
        <UButton
          to="/"
          variant="ghost"
          color="neutral"
          class="-ml-2 px-2 text-left hover:bg-transparent"
          aria-label="Beans home"
        >
          <span class="font-mono text-lg font-semibold tracking-[0.14em] text-stone-100">BEANS</span>
        </UButton>
        <div class="flex items-center gap-2 text-xs text-stone-500">
          <span
            class="size-1.5 rounded-full bg-amber-300"
            aria-hidden="true"
          />
          <span>Live news</span>
        </div>
      </div>
      <nav
        class="border-t border-stone-900"
        aria-label="News categories"
      >
        <div class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
          <UButton
            v-for="item in navigation_items"
            :key="item.to"
            :to="item.to"
            :color="isActive(item.to) ? 'primary' : 'neutral'"
            :variant="isActive(item.to) ? 'soft' : 'ghost'"
            size="xs"
            class="shrink-0 rounded-md font-medium"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            {{ item.label }}
          </UButton>
        </div>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
      <slot />
    </main>
  </div>
</template>
