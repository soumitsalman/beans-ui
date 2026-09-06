// https://nuxt.com/docs/api/configuration/nuxt-config
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
    beans_api_base_url: import.meta.env.BEANS_API_BASE_URL || 'https://cafecito-beans-api.fly.dev',
    espresso_api_base_url: import.meta.env.ESPRESSO_API_BASE_URL || 'https://cafecito-espresso-api.fly.dev',
    cafecito_api_key: import.meta.env.CAFECITO_API_KEY
  },

  routeRules: {
    '/': { prerender: true }
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
