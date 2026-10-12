import { ref } from 'vue'
import type { EspressoSignal } from '~/types/news'

export function useAnalysisFeed() {
  const { fetchSignals } = useEspressoApi()
  const signals = ref<EspressoSignal[]>([])
  const loading_signals = ref(false)

  async function loadSignals(): Promise<void> {
    if (loading_signals.value) return

    loading_signals.value = true
    try {
      const _page = await fetchSignals()
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
