import { computed, reactive, ref } from 'vue'
import type { HomeDiscoveryCriteria } from '#shared/homeDiscovery'
import { HOME_DISCOVERY_COOKIE } from '#shared/homeDiscovery'
import { normaliseTagInput } from '~/utils/formatters'

function criteriaActive(criteria: HomeDiscoveryCriteria | null): criteria is HomeDiscoveryCriteria {
  return Boolean(criteria && (criteria.query || criteria.tags.length))
}

function criteriaLabel(criteria: HomeDiscoveryCriteria | null): string {
  if (!criteriaActive(criteria)) return ''
  return [criteria.query, criteria.tags.length ? criteria.tags.join(', ') : ''].filter(Boolean).join(' · ')
}

export function useHomeDiscovery() {
  const criteria_cookie = useCookie<HomeDiscoveryCriteria | null>(HOME_DISCOVERY_COOKIE, {
    path: '/',
    sameSite: 'lax'
  })
  const { trackEvent } = useGoogleAnalytics()
  const search_form = reactive({
    query: '',
    tags: ''
  })
  const active_criteria = ref<HomeDiscoveryCriteria | null>(null)
  const feed = useNewsFeed(undefined, undefined, 'mixed', active_criteria)

  const searching = computed(() => feed.loading.value && criteriaActive(active_criteria.value))
  const can_clear = computed(() => Boolean(
    search_form.query.trim()
    || search_form.tags.trim()
    || criteriaActive(active_criteria.value)
  ))
  const empty_message = computed(() => {
    const label = criteriaLabel(active_criteria.value)
    return label ? `No news articles matched ${label}.` : 'No news is available right now.'
  })

  function savedCriteria(): HomeDiscoveryCriteria | null {
    const saved = criteria_cookie.value
    if (!saved || typeof saved !== 'object') return null
    const query = typeof saved.query === 'string' ? saved.query.trim() : ''
    const tags = normaliseTagInput(saved.tags)
    if (!query && !tags.length) return null
    return { query, tags }
  }

  function applyForm(criteria: HomeDiscoveryCriteria): void {
    search_form.query = criteria.query
    search_form.tags = criteria.tags.join(', ')
  }

  async function start(): Promise<void> {
    const saved = savedCriteria()
    if (saved) {
      applyForm(saved)
      active_criteria.value = saved
    }
    if (import.meta.server || useNuxtApp().isHydrating) await feed.initialiseFeed()
    else void feed.refreshFeed()
  }

  async function find(): Promise<void> {
    const criteria = {
      query: search_form.query.trim(),
      tags: normaliseTagInput(search_form.tags)
    }
    applyForm(criteria)
    trackEvent('search_submit', { has_topic: Boolean(criteria.query), tag_count: criteria.tags.length })
    active_criteria.value = criteriaActive(criteria) ? criteria : null
    criteria_cookie.value = active_criteria.value
    await feed.refreshFeed()
  }

  async function clearSearch(): Promise<void> {
    const had_active = criteriaActive(active_criteria.value)
    search_form.query = ''
    search_form.tags = ''
    active_criteria.value = null
    criteria_cookie.value = null
    if (had_active) await feed.refreshFeed()
  }

  return {
    search_form,
    articles: feed.articles,
    loading: feed.loading,
    searching,
    error_message: feed.error_message,
    empty_message,
    can_load_more: feed.can_load_more,
    can_clear,
    find,
    clearSearch,
    loadMore: feed.loadMore,
    retry: feed.retryFeed,
    start
  }
}
