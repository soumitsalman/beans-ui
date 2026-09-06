import { computed, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { NewsCategory } from '~/settings/categories'
import type { NewsStory } from '~/types/news'

const PAGE_SIZE = 5

export function useNewsFeed(category?: MaybeRef<NewsCategory | undefined>) {
  const { fetchLatestArticles, fetchStory, fetchTopHeadlines } = useBeansApi()
  const top_headlines = ref<NewsStory[]>([])
  const latest_news = ref<NewsStory[]>([])
  const top_headlines_cursor = ref<string | null>(null)
  const latest_news_cursor = ref<string | null>(null)
  const loading_top_headlines = ref(false)
  const loading_latest_news = ref(false)
  const top_headlines_error = ref<string | null>(null)
  const latest_news_error = ref<string | null>(null)
  const active_category = computed(() => unref(category))
  const can_load_more_top_headlines = computed(() => Boolean(top_headlines_cursor.value))
  const can_load_more_latest_news = computed(() => Boolean(latest_news_cursor.value))

  function filters() {
    return {
      categories: active_category.value?.category_values
    }
  }

  function appendStories(target: NewsStory[], received: NewsStory[]): NewsStory[] {
    const _known_ids = new Set(target.map(storyIdentity))
    const _new_stories: NewsStory[] = []

    for (const story of received) {
      const _story_id = storyIdentity(story)
      if (!_story_id || _known_ids.has(_story_id)) continue

      _known_ids.add(_story_id)
      _new_stories.push(story)
    }

    return [...target, ..._new_stories]
  }

  function storyIdentity(story: NewsStory): string {
    return story.story_id || story.id
  }

  function filterForCategory(stories: NewsStory[]): NewsStory[] {
    const category_values = active_category.value?.category_values
    if (!category_values?.length) return stories

    const allowed_categories = new Set(category_values)
    return stories.filter(story => story.categories.some(category_value => allowed_categories.has(category_value)))
  }

  function nextCursor(value: string | null, previous: string | null, received_count: number): string | null {
    if (!received_count || !value || value === previous) return null
    return value
  }

  function mergeEnrichedStory(feed_story: NewsStory, enriched_story: NewsStory): NewsStory {
    return {
      ...enriched_story,
      title: enriched_story.title || feed_story.title,
      summary: enriched_story.summary || feed_story.summary,
      image_url: enriched_story.image_url || feed_story.image_url
    }
  }

  async function enrichStories(received: NewsStory[], target: 'top' | 'latest'): Promise<void> {
    const _enriched_stories = await Promise.all(
      received.map(async (story) => {
        if (!story.story_id) return story

        try {
          return await fetchStory(story.id)
        } catch {
          return story
        }
      })
    )
    const _target = target === 'top' ? top_headlines : latest_news

    _target.value = _target.value.map((story) => {
      const _enriched_story = _enriched_stories.find(item => item.id === story.id)

      return _enriched_story ? mergeEnrichedStory(story, _enriched_story) : story
    })
  }

  async function loadTopHeadlines(append = false): Promise<void> {
    if (loading_top_headlines.value) return
    if (append && !top_headlines_cursor.value) return

    loading_top_headlines.value = true
    top_headlines_error.value = null
    try {
      const _page = await fetchTopHeadlines({
        ...filters(),
        limit: PAGE_SIZE,
        cursor: append ? top_headlines_cursor.value : undefined
      })
      const _stories = filterForCategory(_page.data)

      top_headlines.value = append
        ? appendStories(top_headlines.value, _stories)
        : appendStories([], _stories)
      top_headlines_cursor.value = nextCursor(
        _page.next_cursor,
        append ? top_headlines_cursor.value : null,
        _page.data.length
      )
      void enrichStories(_stories, 'top')
    } catch {
      top_headlines_error.value = 'Top headlines could not be loaded right now.'
    } finally {
      loading_top_headlines.value = false
    }
  }

  async function loadLatestNews(append = false): Promise<void> {
    if (loading_latest_news.value) return
    if (append && !latest_news_cursor.value) return

    loading_latest_news.value = true
    latest_news_error.value = null
    try {
      const _page = await fetchLatestArticles({
        ...filters(),
        limit: PAGE_SIZE,
        cursor: append ? latest_news_cursor.value : undefined
      })
      const _stories = filterForCategory(_page.data)

      latest_news.value = append
        ? appendStories(latest_news.value, _stories)
        : appendStories([], _stories)
      latest_news_cursor.value = nextCursor(
        _page.next_cursor,
        append ? latest_news_cursor.value : null,
        _page.data.length
      )
      void enrichStories(_stories, 'latest')
    } catch {
      latest_news_error.value = 'Latest news could not be loaded right now.'
    } finally {
      loading_latest_news.value = false
    }
  }

  async function refreshFeed(): Promise<void> {
    top_headlines_error.value = null
    latest_news_error.value = null
    top_headlines_cursor.value = null
    latest_news_cursor.value = null
    await Promise.all([loadTopHeadlines(), loadLatestNews()])
  }

  function retryTopHeadlines(): Promise<void> {
    return loadTopHeadlines(Boolean(top_headlines.value.length))
  }

  function retryLatestNews(): Promise<void> {
    return loadLatestNews(Boolean(latest_news.value.length))
  }

  return {
    top_headlines,
    latest_news,
    loading_top_headlines,
    loading_latest_news,
    can_load_more_top_headlines,
    can_load_more_latest_news,
    top_headlines_error,
    latest_news_error,
    refreshFeed,
    loadMoreTopHeadlines: () => loadTopHeadlines(true),
    loadMoreLatestNews: () => loadLatestNews(true),
    retryTopHeadlines,
    retryLatestNews
  }
}
