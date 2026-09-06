import { defineEventHandler } from 'h3'
import { proxyApi } from '../../utils/proxyApi'

export default defineEventHandler((event) => {
  const runtime_config = useRuntimeConfig()

  return proxyApi(event, runtime_config.beans_api_base_url, runtime_config.cafecito_api_key)
})
