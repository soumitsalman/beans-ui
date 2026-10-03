import type { MaybeRefOrGetter } from 'vue'
import type { PageMetadata } from '~/types/discovery'
import type { AnalyticsPageMetadata } from '~/types/analytics'

export function usePageMetadata(metadata: MaybeRefOrGetter<PageMetadata>) {
  const route = useRoute()
  const SITE_URL = useRuntimeConfig().public.site_url.replace(/\/+$/, '')
  const page = computed(() => toValue(metadata))
  const analytics_page = useState<AnalyticsPageMetadata | null>('analytics-page', () => null)
  watchEffect(() => {
    if (page.value.ready === false) return
    analytics_page.value = { path: (page.value.path || route.path).split('?')[0]!, title: page.value.title }
  })
  const page_url = computed(() => `${SITE_URL}${page.value.path || route.path}`)
  const page_image = computed(() => {
    try {
      const url = new URL(page.value.image || '/beans-banner.png', SITE_URL)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : `${SITE_URL}/beans-banner.png`
    } catch {
      return `${SITE_URL}/beans-banner.png`
    }
  })
  useSeoMeta({
    title: () => page.value.title,
    description: () => page.value.description,
    ogTitle: () => page.value.title,
    ogDescription: () => page.value.description,
    ogUrl: page_url,
    ogImage: page_image,
    ogImageAlt: () => page.value.image_alt || page.value.title,
    twitterTitle: () => page.value.title,
    twitterDescription: () => page.value.description,
    twitterImage: page_image,
    twitterImageAlt: () => page.value.image_alt || page.value.title
  })
  useHead(() => ({
    link: [{ key: 'canonical', rel: 'canonical', href: page_url.value }],
    script: [{
      key: 'beans-page-json-ld',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [{
          '@type': page.value.kind || 'WebPage',
          '@id': `${page_url.value}#page`,
          'url': page_url.value,
          'name': page.value.title,
          'description': page.value.description,
          ...(page.value.original_article?.url
            ? {
                citation: {
                  '@type': 'CreativeWork',
                  'name': page.value.original_article.title,
                  'url': page.value.original_article.url,
                  'datePublished': page.value.original_article.published_at || undefined,
                  'creditText': page.value.original_article.author ? `By ${page.value.original_article.author}` : undefined,
                  'publisher': page.value.original_article.source?.site_name
                    ? {
                        '@type': 'Organization',
                        'name': page.value.original_article.source.site_name
                      }
                    : undefined
                }
              }
            : {}),
          'isPartOf': { '@id': `${SITE_URL}/#website` }
        }, ...(page.value.breadcrumbs?.length
          ? [{
              '@type': 'BreadcrumbList',
              'itemListElement': page.value.breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
                'item': `${SITE_URL}${item.path}`
              }))
            }]
          : [])]
      }).replace(/</g, '\\u003c')
    }]
  }))
}
