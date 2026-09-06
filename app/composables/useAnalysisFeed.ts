import { ref } from 'vue'
import type { EspressoSignal } from '~/types/news'

const PAGE_SIZE = 5

export function useAnalysisFeed() {
  const { fetchSignals } = useEspressoApi()
  const signals = ref<EspressoSignal[]>([])
  const loading_signals = ref(false)

  async function loadSignals(): Promise<void> {
    if (loading_signals.value) return

    loading_signals.value = true
    try {
      const _page = await fetchSignals({ limit: PAGE_SIZE })
      signals.value = _page.data
    } catch {
      signals.value = []
    } finally {
      loading_signals.value = false
    }
  }

  return {
    signals,
    loading_signals,
    loadSignals
  }
}
