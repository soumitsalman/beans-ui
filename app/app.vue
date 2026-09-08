<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const runtime_config = useRuntimeConfig()
const SITE_URL = runtime_config.public.site_url.replace(/\/+$/, '')
const SITE_TITLE = 'Beans | Publisher News and Trending Stories'
const SITE_DESCRIPTION = 'Beans is a news discovery app from Project Cafecito that groups publisher reporting into current and trending stories while preserving source context.'
const SOCIAL_IMAGE_URL = `${SITE_URL}/beans-banner.png`
const canonical_url = computed(() => `${SITE_URL}${route.path}`)
const structured_data = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://cafecito.tech/#organization',
      'name': 'Project Cafecito',
      'url': 'https://cafecito.tech',
      'sameAs': ['https://github.com/soumitsalman/beans-ui']
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      'name': 'Beans',
      'url': SITE_URL,
      'description': SITE_DESCRIPTION,
      'publisher': {
        '@id': 'https://cafecito.tech/#organization'
      }
    }
  ]
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { key: 'canonical', rel: 'canonical', href: canonical_url }
  ],
  script: [
    {
      key: 'beans-organization-website-json-ld',
      type: 'application/ld+json',
      innerHTML: structured_data
    }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  ogTitle: SITE_TITLE,
  ogDescription: SITE_DESCRIPTION,
  ogImage: SOCIAL_IMAGE_URL,
  ogImageAlt: 'Beans news and trending stories',
  ogImageWidth: 1792,
  ogImageHeight: 576,
  ogSiteName: 'Beans',
  ogType: 'website',
  ogUrl: canonical_url,
  twitterCard: 'summary_large_image',
  twitterTitle: SITE_TITLE,
  twitterDescription: SITE_DESCRIPTION,
  twitterImage: SOCIAL_IMAGE_URL,
  twitterImageAlt: 'Beans news and trending stories'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
