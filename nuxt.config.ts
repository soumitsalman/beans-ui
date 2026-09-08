// https://nuxt.com/docs/api/configuration/nuxt-config
const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    beans_api_base_url: ENV.BEANS_API_BASE_URL?.trim() || 'https://cafecito-beans-api.fly.dev',
    espresso_api_base_url: ENV.ESPRESSO_API_BASE_URL?.trim() || 'https://cafecito-espresso-api.fly.dev',
    cafecito_api_key: ENV.CAFECITO_API_KEY,
    public: {
      site_url: ENV.NUXT_PUBLIC_SITE_URL?.trim() || 'https://cafecito-beans-app.fly.dev'
    }
  },

  routeRules: {
    '/': { prerender: ENV.NUXT_SKIP_HOME_PRERENDER !== '1' }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
