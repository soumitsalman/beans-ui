import type { BeansPageParams, EspressoSignal, NewsArticle, NewsPage } from '~/types/news'
import type { StoryAction, SourceAction } from '#shared/actions'

export function useBeansApi() {
  const { executeAction } = useBeansActions()
  return {
    fetchSearchArticles: (params: BeansPageParams = {}) => executeAction<NewsPage<NewsArticle>>('search', {
      q: params.q, tags: params.tags, domains: params.domains, cursor: params.cursor
    }),
    fetchStory: (id: string) => executeAction<StoryAction>('story', { id }),
    fetchSource: (id: string) => executeAction<SourceAction>('source', { id }),
    fetchCoverage: (id: string) => executeAction<NewsPage<NewsArticle>>('coverage', { id }),
    fetchRelated: (id: string, cursor?: string | null) => executeAction<NewsPage<NewsArticle>>('related', { id, cursor })
  }
}

export function useEspressoApi() {
  const { executeAction } = useBeansActions()
  return { fetchSignals: () => executeAction<NewsPage<EspressoSignal>>('signals') }
}
