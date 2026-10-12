import { computed, nextTick, onMounted, onScopeDispose, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { NewsCategory } from '~/settings/categories'
import type { NewsArticle, NewsStory } from '~/types/news'
import type { FeedSnapshot } from '~/types/discovery'
import type { StoryEnrichment } from '#shared/actions'
import { requestErrorMessage } from '~/utils/resourceError'
import { logClientEvent } from '~/utils/telemetry'

export interface NewsFeedSearch { query: string, tags: string[] }

export function useNewsFeed(
  category?: MaybeRef<NewsCategory | undefined>,
  source_id?: MaybeRef<string | undefined>,
  search?: MaybeRef<NewsFeedSearch | null | undefined>
) {
  const { executeAction } = useBeansActions()
  const route = useRoute()
  const articles = ref<NewsArticle[]>([])
  const loading = ref(false)
  const error_message = ref<string | null>(null)
  const paging = ref<FeedSnapshot | null>(null)
  const can_load_more = computed(() => Boolean(unref(source_id)
    ? paging.value?.source_cursor
    : paging.value?.cursor))
  let _generation = 0
  let _last_attempt_append = false
  const _requested_story_ids = new Set<string>()

  async function loadStoryEnrichment(stories: NewsStory[], generation: number): Promise<void> {
    if (import.meta.server || unref(source_id)) return
    const ids = [...new Set(stories.map(story => story.id).filter(id => id && !_requested_story_ids.has(id)))]
    if (!ids.length) return
    ids.forEach(id => _requested_story_ids.add(id))
    await nextTick()
    if (generation !== _generation) return
    try {
      const enrichment = await executeAction<Record<string, StoryEnrichment>>('story_enrichment', { ids })
      if (generation !== _generation) return
      articles.value = articles.value.map(article => enrichment[article.id]
        ? { ...article, ...enrichment[article.id] }
        : article)
    } catch {
      // Story cards remain usable when optional publisher enrichment fails.
    }
  }

  function restoreFeed(snapshot: FeedSnapshot): void {
    articles.value = snapshot.articles
    paging.value = snapshot
    error_message.value = snapshot.error_message
  }

  async function loadBatch(append: boolean): Promise<void> {
    if (append && (loading.value || (!can_load_more.value && !error_message.value))) return
    const generation = append ? _generation : ++_generation
    if (!append) _requested_story_ids.clear()
    _last_attempt_append = append
    loading.value = true
    error_message.value = null
    const state = append ? paging.value : null
    const current_search = unref(search)
    try {
      const snapshot = await executeAction<FeedSnapshot>('feed', {
        categories: unref(category)?.category_values ? [...unref(category)!.category_values!] : undefined,
        source_id: unref(source_id),
        q: current_search?.query?.trim() || undefined, tags: current_search?.tags,
        cursor: state?.cursor, from: state?.from, source_cursor: state?.source_cursor,
        seen_ids: append ? articles.value.map(article => article.id).filter(Boolean).slice(-2000) : undefined
      })
      if (generation !== _generation) return
      if (snapshot.error_message && !snapshot.articles.length && articles.value.length) {
        error_message.value = snapshot.error_message
        return
      }
      articles.value = append ? [...articles.value, ...snapshot.articles] : snapshot.articles
      paging.value = snapshot
      error_message.value = snapshot.error_message
      if (!unref(source_id)) void loadStoryEnrichment(snapshot.articles as NewsStory[], generation)
      logClientEvent({ event: 'content_load', path: route.path,
        surface: unref(source_id) ? 'source' : unref(category) ? 'category' : 'home',
        feed: unref(source_id) ? 'source_latest' : 'article_feed', action: append ? 'more' : 'initial',
        outcome: error_message.value ? 'error' : 'success', requested_count: 5,
        received_count: snapshot.articles.length, visible_count: articles.value.length, cursor_present: can_load_more.value })
    } catch (error) {
      if (generation === _generation) error_message.value = requestErrorMessage(error, 'News could not be loaded right now.')
    } finally {
      if (generation === _generation) loading.value = false
    }
  }
  async function initialiseFeed(snapshot?: FeedSnapshot): Promise<void> {
    if (snapshot) {
      restoreFeed(snapshot)
      return
    }
    const { data } = await useAsyncData(`feed:${route.path}`, async () => {
      await loadBatch(false)
      return { ...paging.value, articles: articles.value, error_message: error_message.value }
    })
    if (data.value) {
      articles.value = data.value.articles
      error_message.value = data.value.error_message
      paging.value = data.value as FeedSnapshot
    }
  }
  onScopeDispose(() => {
    _generation++
  })
  onMounted(() => {
    if (!unref(source_id)) void loadStoryEnrichment(articles.value as NewsStory[], _generation)
  })
  return { articles, loading, error_message, can_load_more, initialiseFeed,
    refreshFeed: () => loadBatch(false), loadMore: () => loadBatch(true),
    retryFeed: () => loadBatch(_last_attempt_append), restoreFeed }
}
