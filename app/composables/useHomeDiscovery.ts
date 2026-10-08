import { computed, reactive, ref, watch } from 'vue'
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
  const route = useRoute()
  const router = useRouter()
  const nuxt_app = useNuxtApp()
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

  function routeQuery(): { present: boolean, value: string } {
    const raw_query = route.query.q
    if (Array.isArray(raw_query)) return { present: true, value: String(raw_query[0] ?? '').trim() }
    return {
      present: raw_query !== undefined && raw_query !== null,
      value: typeof raw_query === 'string' ? raw_query.trim() : String(raw_query ?? '').trim()
    }
  }

  function routeCriteria(): HomeDiscoveryCriteria | null {
    const query = routeQuery()
    if (query.present) {
      if (!query.value) return null
      return { query: query.value, tags: savedCriteria()?.tags ?? [] }
    }
    return savedCriteria()
  }

  function criteriaSignature(criteria: HomeDiscoveryCriteria | null): string {
    return criteria ? `${criteria.query}\0${criteria.tags.join(',')}` : ''
  }

  function setActiveCriteria(criteria: HomeDiscoveryCriteria | null, sync_cookie: boolean): void {
    if (criteria) applyForm(criteria)
    else {
      search_form.query = ''
      search_form.tags = ''
    }
    active_criteria.value = criteriaActive(criteria) ? criteria : null
    if (sync_cookie) criteria_cookie.value = active_criteria.value
  }

  async function syncRouteCriteria(refresh: boolean): Promise<void> {
    const criteria = routeCriteria()
    const previous_signature = criteriaSignature(active_criteria.value)
    const next_signature = criteriaSignature(criteria)

    setActiveCriteria(criteria, routeQuery().present)
    if (refresh && previous_signature !== next_signature) await feed.refreshFeed()
  }

  async function writeHomeRoute(query: string): Promise<void> {
    _syncing_route = true
    try {
      await router.replace({ query: query ? { q: query } : {} })
    } finally {
      _syncing_route = false
    }
  }

  let _syncing_route = false
  let _last_route_query: string | null | undefined

  async function start(): Promise<void> {
    void syncRouteCriteria(false)
    const query = routeQuery()
    _last_route_query = query.present && query.value ? query.value : null
    if (import.meta.server || nuxt_app.isHydrating) await feed.initialiseFeed()
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
    await writeHomeRoute(criteria.query)
    await feed.refreshFeed()
  }

  async function clearSearch(): Promise<void> {
    const had_active = criteriaActive(active_criteria.value)
    search_form.query = ''
    search_form.tags = ''
    active_criteria.value = null
    criteria_cookie.value = null
    await writeHomeRoute('')
    if (had_active) await feed.refreshFeed()
  }

  watch(
    () => {
      const query = routeQuery()
      return `${query.present}\0${query.value}`
    },
    () => {
      const query = routeQuery()
      const previous_query = _last_route_query
      _last_route_query = query.present && query.value ? query.value : null
      if (_syncing_route) return

      if (previous_query && !query.present) {
        const saved = savedCriteria()
        const criteria = saved?.tags.length ? { query: '', tags: saved.tags } : null
        const previous_signature = criteriaSignature(active_criteria.value)
        setActiveCriteria(criteria, true)
        if (previous_signature !== criteriaSignature(criteria)) void feed.refreshFeed()
        return
      }

      void syncRouteCriteria(true)
    }
  )

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
