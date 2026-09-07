<script setup lang="ts">
useSeoMeta({
  title: 'About Beans | Beans',
  description: 'About the Beans news and trending-stories reader from Cafecito.'
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-5">
    <div class="space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
        Cafecito
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        About Beans
      </h1>
    </div>
    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <p class="text-sm leading-6 text-stone-300">
        Beans is a focused, mobile-first view of publisher reporting and the stories forming around it.
      </p>
      <p class="mt-3 text-sm leading-6 text-stone-400">
        It groups related coverage, keeps source context visible, and links back to the original publishers.
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-1">
        <UButton
          to="/"
          label="Home"
          color="neutral"
          variant="soft"
          size="xs"
        />
        <UButton
          to="/search"
          label="Search"
          color="neutral"
          variant="soft"
          size="xs"
        />
        <UButton
          to="https://cafecito.tech"
          label="Cafecito"
          color="neutral"
          variant="soft"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="https://developer.cafecito.tech/products/beans"
          label="API"
          color="neutral"
          variant="soft"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
        <UButton
          to="https://developer.cafecito.tech/contact"
          label="Contact"
          color="neutral"
          variant="soft"
          size="xs"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
      </div>
    </UCard>
  </div>
</template>
