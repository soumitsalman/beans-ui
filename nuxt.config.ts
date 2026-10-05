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

  app: {
    head: {
      meta: [
        {
          name: 'msvalidate.01',
          content: '65E9BF6A4B003B4D3FE6AD6E6673A644'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    beans_api_base_url: ENV.BEANS_API_BASE_URL?.trim() || 'https://cafecito-beans-api.fly.dev',
    espresso_api_base_url: ENV.ESPRESSO_API_BASE_URL?.trim() || 'https://cafecito-espresso-api.fly.dev',
    cafecito_api_key: ENV.CAFECITO_API_KEY,
    public: {
      vitals_report_all_changes: false,
      site_url: ENV.NUXT_PUBLIC_SITE_URL?.trim() || 'https://beans.cafecito.tech',
      ga_measurement_id: ENV.NUXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-KPG0Y2MBV9'
    }
  },

  routeRules: {
    '/': { prerender: false }
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
