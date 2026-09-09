import { withOutboundReferral } from '~/utils/outboundUrl'

export function useOutboundUrl() {
  const runtime_config = useRuntimeConfig()
  const site_origin = String(runtime_config.public.site_url || '')

  function outboundHref(href?: string | null): string | undefined {
    return withOutboundReferral(href, site_origin)
  }

  return { outboundHref }
}
