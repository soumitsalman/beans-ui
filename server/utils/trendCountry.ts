import Negotiator from 'negotiator'

export function resolveTrendCountry(accept_language?: string): string {
  const locales = new Negotiator({ headers: { 'accept-language': accept_language || '' } }).languages()
  for (const locale of locales) {
    try {
      const country = new Intl.Locale(locale).region
      if (country && /^[A-Z]{2}$/.test(country)) return country
    } catch {
      // Ignore malformed and wildcard locales.
    }
  }
  return 'US'
}
