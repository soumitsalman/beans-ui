<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_GROUPS } from '~/settings/categories'

const route = useRoute()
const NOW = new Date()
const CURRENT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: '2-digit'
})
const current_date = CURRENT_DATE_FORMATTER.format(NOW)
const current_date_iso = [
  NOW.getFullYear(),
  String(NOW.getMonth() + 1).padStart(2, '0'),
  String(NOW.getDate()).padStart(2, '0')
].join('-')
const navigation_items = computed(() => [
  { label: 'Now', to: '/' },
  ...CATEGORY_GROUPS.map(category => ({
    label: category.label,
    to: `/categories/${category.slug}`
  }))
])

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-stone-100">
    <header class="sticky top-0 z-30 border-b border-stone-800/90 bg-stone-950/95 backdrop-blur">
      <div class="mx-auto flex h-15 max-w-6xl items-center gap-1 px-3 sm:px-6">
        <time
          :datetime="current_date_iso"
          class="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium tabular-nums text-stone-400 sm:text-xs"
          :aria-label="`Live, ${current_date}`"
        >
          <span
            class="relative inline-flex size-3.5 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span class="absolute size-2.5 animate-pulse rounded-full bg-primary/50 blur-[3px]" />
            <UIcon
              name="lucide:radio"
              class="relative size-3 text-primary drop-shadow-[0_0_6px_var(--ui-primary)]"
            />
          </span>
          {{ current_date }}
        </time>
        <div class="flex min-w-0 flex-1 justify-center">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            class="min-w-0 px-1.5 text-left hover:bg-transparent sm:px-2"
            aria-label="Beans home"
          >
            <img
              src="/beans-dark.png"
              alt=""
              class="size-6 shrink-0 rounded-sm"
            >
            <span class="truncate font-mono text-base font-semibold tracking-[0.1em] text-stone-100 sm:text-lg">BEANS</span>
          </UButton>
        </div>
        <div class="flex shrink-0 items-center gap-0.5">
          <UTooltip text="Search news">
            <UButton
              to="/search"
              icon="lucide:search"
              color="neutral"
              variant="ghost"
              square
              aria-label="Search news"
            />
          </UTooltip>
          <UTooltip text="Beans API">
            <UButton
              to="https://developer.cafecito.tech/products/beans"
              icon="lucide:braces"
              color="neutral"
              variant="ghost"
              square
              external
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Beans API documentation"
            />
          </UTooltip>
          <UTooltip text="Contact">
            <UButton
              to="https://developer.cafecito.tech/contact"
              icon="lucide:mail"
              color="neutral"
              variant="ghost"
              square
              external
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Cafecito"
            />
          </UTooltip>
        </div>
      </div>
      <nav
        class="border-t border-stone-900"
        aria-label="News categories"
      >
        <div class="mx-auto max-w-6xl overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
          <div class="flex w-max min-w-full justify-between gap-1">
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
        </div>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
      <slot />
    </main>

    <footer class="border-t border-stone-800/90 px-4 py-6 sm:px-6">
      <nav
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-1 gap-y-1"
        aria-label="Beans links"
      >
        <UButton
          to="https://cafecito.tech"
          label="Cafecito"
          color="neutral"
          variant="link"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="https://espresso.cafecito.tech"
          label="Publications"
          color="neutral"
          variant="link"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="https://developer.cafecito.tech"
          label="API"
          color="neutral"
          variant="link"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="https://github.com/soumitsalman/beans-ui"
          label="Github"
          color="neutral"
          variant="link"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="/about-beans"
          label="About"
          color="neutral"
          variant="link"
          size="xs"
        />
      </nav>
    </footer>
  </div>
</template>
