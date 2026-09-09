<script setup lang="ts">
const runtime_config = useRuntimeConfig()
const { outboundHref } = useOutboundUrl()
const SITE_URL = runtime_config.public.site_url.replace(/\/+$/, '')
const PAGE_URL = `${SITE_URL}/about-beans`
const PAGE_TITLE = 'About Beans | Publisher News Discovery'
const PAGE_DESCRIPTION = 'Beans is a news discovery app from Project Cafecito. It groups publisher reporting into current and trending stories, preserves source context, and links to original coverage.'
const structured_data = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'Beans',
  'applicationCategory': 'NewsApplication',
  'applicationSubCategory': 'News discovery',
  'operatingSystem': 'Web',
  'url': PAGE_URL,
  'image': `${SITE_URL}/beans-banner.png`,
  'description': PAGE_DESCRIPTION,
  'provider': {
    '@type': 'Organization',
    'name': 'Project Cafecito',
    'url': 'https://cafecito.tech'
  }
})

useSeoMeta({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ogTitle: PAGE_TITLE,
  ogDescription: PAGE_DESCRIPTION,
  ogUrl: PAGE_URL,
  ogImage: `${SITE_URL}/beans-banner.png`,
  ogImageAlt: 'Beans news and trending stories',
  twitterTitle: PAGE_TITLE,
  twitterDescription: PAGE_DESCRIPTION,
  twitterImage: `${SITE_URL}/beans-banner.png`,
  twitterImageAlt: 'Beans news and trending stories'
})

useHead({
  script: [
    {
      key: 'beans-software-application-json-ld',
      type: 'application/ld+json',
      innerHTML: structured_data
    }
  ]
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2 px-1">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
        Project Cafecito
      </p>
      <h1 class="text-2xl font-semibold text-stone-100 sm:text-3xl">
        About Beans
      </h1>
      <p class="max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">
        A news discovery app for seeing what publishers are reporting and what is gaining attention.
      </p>
    </div>

    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="lucide:newspaper"
            class="size-5 text-primary"
          />
          <h2 class="text-lg font-semibold text-stone-100">
            What is the Beans app?
          </h2>
        </div>
        <p class="text-sm leading-6 text-stone-300">
          Beans presents concise snapshots of original publisher reporting, groups related coverage into stories, and links you back to the source. It is a news discovery app, not a publisher or a replacement for the original article.
        </p>
        <p class="text-sm leading-6 text-stone-400">
          Trending stories use engagement signals and cross-publisher coverage to show what is receiving attention. Related reporting is grouped so you can inspect the sources and supporting coverage around a developing story.
        </p>
      </div>
    </UCard>

    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="lucide:braces"
            class="size-5 text-primary"
          />
          <h2 class="text-lg font-semibold text-stone-100">
            More is available through the Beans API
          </h2>
        </div>
        <p class="text-sm leading-6 text-stone-300">
          The data behind this app is powered by the publicly available Beans API from Project Cafecito. This interface intentionally shows a focused subset of the API's news, story, source, and trend data.
        </p>
        <p class="text-sm leading-6 text-stone-400">
          Use the API when you need a broader and more diverse dataset, your own filters, semantic search, trend signals, story-propagation timelines, or MCP access for an application or AI workflow.
        </p>
        <UButton
          :to="outboundHref('https://developer.cafecito.tech/products/beans')"
          label="Explore the Beans API"
          icon="lucide:external-link"
          trailing
          color="primary"
          variant="soft"
          size="sm"
          external
          target="_blank"
          rel="noopener noreferrer"
        />
      </div>
    </UCard>

    <UCard class="bg-stone-900/50 ring-stone-800/90">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="lucide:scan-search"
            class="size-5 text-primary"
          />
          <h2 class="text-lg font-semibold text-stone-100">
            Why use Beans?
          </h2>
        </div>
        <p class="text-sm leading-6 text-stone-300">
          Beans was created to offer a more realistic view of what is latest and what is trending, without relying on the gamified, search-optimized ranking patterns that can shape conventional news discovery.
        </p>
        <p class="text-sm leading-6 text-stone-400">
          In a world of misleading and fabricated news, Beans helps you inspect a story in context. It correlates coverage across publishers to surface related reporting and supporting artifacts, while keeping the original sources visible so you can judge the evidence for yourself.
        </p>
      </div>
    </UCard>

    <section
      class="space-y-3"
      aria-labelledby="cafecito-products"
    >
      <div class="space-y-1 px-1">
        <h2
          id="cafecito-products"
          class="text-lg font-semibold text-stone-100"
        >
          Explore other Cafecito products
        </h2>
        <p class="text-sm leading-6 text-stone-400">
          Project Cafecito builds practical, API-first tools for focused information and operational workflows.
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <UCard class="bg-stone-900/50 ring-stone-800/90">
          <div class="flex h-full flex-col gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
                Live · Intelligence
              </p>
              <h3 class="mt-1 font-semibold text-stone-100">
                Espresso
              </h3>
            </div>
            <p class="grow text-sm leading-6 text-stone-400">
              Cafecito's business-intelligence suite includes an API, social digests, and Espresso Publications. Its publications are editorial and opinion pieces that decipher varied market events and signals. Unlike Beans, they are analysis—not snapshots of original news-publisher reporting.
            </p>
            <UButton
              :to="outboundHref('https://cafecito.tech/espresso/')"
              label="Explore Espresso"
              icon="lucide:external-link"
              trailing
              color="neutral"
              variant="soft"
              size="sm"
              external
              target="_blank"
              rel="noopener noreferrer"
              class="self-start"
            />
          </div>
        </UCard>

        <UCard class="bg-stone-900/50 ring-stone-800/90">
          <div class="flex h-full flex-col gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                In development · Social automation
              </p>
              <h3 class="mt-1 font-semibold text-stone-100">
                Cortado
              </h3>
            </div>
            <p class="grow text-sm leading-6 text-stone-400">
              Social media automation designed to keep publishing consistent, campaigns organized, and manual work to a minimum.
            </p>
          </div>
        </UCard>

        <UCard class="bg-stone-900/50 ring-stone-800/90 sm:col-span-2">
          <div class="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="max-w-xl">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                In development · Medical operations
              </p>
              <h3 class="mt-1 font-semibold text-stone-100">
                MediCafe
              </h3>
              <p class="mt-3 text-sm leading-6 text-stone-400">
                Medical billing automation focused on reducing claim denials, paperwork friction, and administrative overhead.
              </p>
            </div>
            <UButton
              :to="outboundHref('https://cafecito.tech/#products')"
              label="All Cafecito products"
              icon="lucide:external-link"
              trailing
              color="neutral"
              variant="soft"
              size="sm"
              external
              target="_blank"
              rel="noopener noreferrer"
              class="self-start sm:self-center"
            />
          </div>
        </UCard>
      </div>
    </section>

    <div class="flex flex-wrap items-center gap-2 px-1">
      <UButton
        to="/"
        label="Read the news"
        icon="lucide:arrow-left"
        color="neutral"
        variant="soft"
        size="sm"
      />
      <UButton
        :to="outboundHref('https://cafecito.tech')"
        label="Visit Project Cafecito"
        icon="lucide:external-link"
        trailing
        color="neutral"
        variant="ghost"
        size="sm"
        external
        target="_blank"
        rel="noopener noreferrer"
      />
    </div>
  </div>
</template>
