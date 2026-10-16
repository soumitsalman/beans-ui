import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { NewsPublisher } from '~/types/news'
import { sourceFaviconUrl } from '~/utils/source'

export function useFaviconPublishers(publishers: MaybeRefOrGetter<NewsPublisher[] | undefined>) {
  const _failed_favicon_urls = ref(new Set<string>())

  watch(() => toValue(publishers), () => {
    _failed_favicon_urls.value = new Set()
  })

  const favicon_publishers = computed(() => (toValue(publishers) ?? []).filter((publisher) => {
    const favicon_url = sourceFaviconUrl(publisher)
    return Boolean(favicon_url && !_failed_favicon_urls.value.has(favicon_url))
  }))

  function hideFavicon(favicon_url?: string): void {
    if (!favicon_url || _failed_favicon_urls.value.has(favicon_url)) return
    const next_urls = new Set(_failed_favicon_urls.value)
    next_urls.add(favicon_url)
    _failed_favicon_urls.value = next_urls
  }

  return { favicon_publishers, hideFavicon }
}
