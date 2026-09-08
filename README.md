# Beans UI

Beans is a mobile-first, dark-mode news discovery app from Project Cafecito. It groups current and trending publisher reporting into stories, preserves source context, and links readers to the original coverage.

Beans presents snapshots rather than republishing full articles. Trend signals and cross-publisher correlation provide context for discovery; they are not a claim that a story is true or complete.

## Product and data

- Homepage: current and trending publisher news, organized as related stories.
- Categories: eight broad news topics, each mapped to the Beans API taxonomy.
- Story view: source coverage, article chronology, and available engagement signals.
- Search: semantic topic search plus normalized-tag and publisher-source filters.
- Data: the interface is centered on the Beans API. Server proxy support for Espresso remains available for Cafecito integrations, but Espresso Publications are a separate editorial product.

For programmatic access, semantic search, filters, trend signals, and MCP workflows, use the [Beans API documentation](https://developer.cafecito.tech/products/beans).

## Requirements

- Node.js 22+
- pnpm 10.33.0+

## Development

```bash
pnpm install
pnpm dev
```

The development server is available at `http://localhost:3000`.

## Scripts

```bash
pnpm dev         # Start the development server
pnpm build       # Build the production app
pnpm preview     # Preview the production build
pnpm lint        # Run ESLint
pnpm typecheck   # Run Nuxt/Vue type checking
```

## Configuration

Copy `.env.example` to `.env` and set values as needed:

```dotenv
CAFECITO_API_KEY=
BEANS_API_BASE_URL=https://cafecito-beans-api.fly.dev
ESPRESSO_API_BASE_URL=https://cafecito-espresso-api.fly.dev
NUXT_PUBLIC_SITE_URL=https://cafecito-beans-app.fly.dev
```

The API base URLs have the defaults shown above. `CAFECITO_API_KEY` is server-only and is used by the API proxy routes. Set `NUXT_PUBLIC_SITE_URL` to the public canonical origin when deploying under a custom domain.

## Routes

- `/` — trending and latest stories
- `/categories/{category_slug}` — stories filtered by category
- `/stories/{story_id}` — story details, propagation, and coverage
- `/search` — semantic search across news and articles
- `/about-beans` — product and source-context overview

## Search and AI discoverability

- Every page emits a canonical URL, Open Graph/Twitter metadata, and site-wide `Organization` and `WebSite` JSON-LD.
- `/about-beans` adds `SoftwareApplication` JSON-LD and a source-faithful product explanation.
- `/robots.txt` allows public pages and blocks internal API proxy routes; `/sitemap.xml` lists stable public routes; `/llms.txt` provides a concise guide for AI agents.
- Story, feed, and publisher data changes frequently. Use the [Beans API documentation](https://developer.cafecito.tech/products/beans) for programmatic or freshness-sensitive retrieval.

## Project layout

- `app/` — Nuxt pages, components, composables, types, and UI utilities
- `server/` — server-side API proxy and public-discoverability routes
- `public/` — product icons and static assets
- `design/` — UI design, data-source, and verification guidance

## Production

The app is configured for a Node server deployment on Fly.io. The Docker image builds the Nuxt output and serves it on port `8080`.

## License

See [LICENSE](./LICENSE).
